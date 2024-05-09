const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_material_price', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_material_price", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    material_price: {
                        name: "sap.plc.db::basis.t_material_price",
                        data: testData.oMaterialPrice
                    },
                    material_price_ext: {
                        name: "sap.plc.db::basis.t_material_price_ext"
                    },
                    material: {
                        name: "sap.plc.db::basis.t_material",
                        data: testData.oMaterial
                    },
                    plant: {
                        name: "sap.plc.db::basis.t_plant",
                        data: testData.oPlant
                    },
                    vendor: {
                        name: "sap.plc.db::basis.t_vendor",
                        data: testData.oVendor
                    },
                    project: {
                        name: "sap.plc.db::basis.t_project"
                    },
                    customer: {
                        name: "sap.plc.db::basis.t_customer",
                        data: testData.oCustomer
                    },
                    currency: {
                        name: "sap.plc.db::basis.t_currency",
                        data: testData.oCurrency
                    },
                    uom: {
                        name: "sap.plc.db::basis.t_uom",
                        data: testData.oUom
                    },
                    price_source: {
                        name: "sap.plc.db::basis.t_price_source",
                        data: testData.oPriceSource
                    },
                    metadata: {
                        name: "sap.plc.db::basis.t_metadata"
                    },
                    metadata_attributes: {
                        name: "sap.plc.db::basis.t_metadata_item_attributes"
                    },
                    error: {
                        name: "sap.plc.db::map.t_replication_log",
                        data: testData.oError
                    }
                }
            });
        });

        afterOnce(function() {
            oMockstarPlc.cleanup(); // clean up all test artefacts
        });

        beforeEach(function() {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                oMockstarPlc.insertTableData("material_price_ext", testData.oMaterialPriceExt);
            }
        });

        afterEach(function() {});

        function pickFromTableData(oTableDataObject, aIndices) {
            var oReturnObject = {};
            _.each(oTableDataObject, function(aValues, sColumnName) {
                // since _.pick returns an object, the result must be converted back to an array
                oReturnObject[sColumnName] = _.toArray(_.pick(aValues, aIndices));
            });
            return oReturnObject;
        }

        it('should not create a material price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should create a new material price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[4],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4], // 'MAT3'
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[2], // 'PL2'
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[4],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[4],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[4],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[4],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[4],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[4],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.PRICE_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{material_price}} 
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and VENDOR_ID = '${aInputRows[0].VENDOR_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'`);
            expect(aBeforeResults.columns.MATERIAL_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_price");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VENDOR_ID": [aInputRows[0].VENDOR_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "PURCHASING_GROUP": [aInputRows[0].PURCHASING_GROUP],
                "PURCHASING_DOCUMENT": [aInputRows[0].PURCHASING_DOCUMENT],
                "LOCAL_CONTENT": [aInputRows[0].LOCAL_CONTENT],
                "VALID_FROM": [aInputRows[0].VALID_FROM],
                "VALID_TO": [aInputRows[0].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[0].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[0].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[0].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[0].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[0].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[0].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[0].PRICE_UNIT_UOM_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_price_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CMPR_BOOLEAN_INT_MANUAL": [aInputRows[0].CMPR_BOOLEAN_INT_MANUAL],
                    "CMPR_DECIMAL_MANUAL": [aInputRows[0].CMPR_DECIMAL_MANUAL],
                    "CMPR_DECIMAL_UNIT": [aInputRows[0].CMPR_DECIMAL_UNIT],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_MANUAL],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_UNIT],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_MANUAL],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_UNIT],
                }, ["CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT",
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                ]);
            }
        });

        it('should update an existing material price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[4],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[4],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[4],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[4],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[4],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[4],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[4],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[4],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.PRICE_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and VENDOR_ID = '${aInputRows[0].VENDOR_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.MATERIAL_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_price");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and VENDOR_ID = '${aInputRows[0].VENDOR_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VENDOR_ID": [aInputRows[0].VENDOR_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "PURCHASING_GROUP": [aInputRows[0].PURCHASING_GROUP],
                "PURCHASING_DOCUMENT": [aInputRows[0].PURCHASING_DOCUMENT],
                "LOCAL_CONTENT": [aInputRows[0].LOCAL_CONTENT],
                "VALID_FROM": [aInputRows[0].VALID_FROM],
                "VALID_TO": [aInputRows[0].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[0].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[0].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[0].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[0].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[0].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[0].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[0].PRICE_UNIT_UOM_ID],
                "_VALID_TO": [null],
                "_SOURCE": [aInputRows[0]._SOURCE],
                "_CREATED_BY": [sCurrentUser]
            }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and MATERIAL_ID = '${aInputRows[0].MATERIAL_ID}'
                and PLANT_ID = '${aInputRows[0].PLANT_ID}'
                and VENDOR_ID = '${aInputRows[0].VENDOR_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID],
                "VENDOR_ID": [aInputRows[0].VENDOR_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "PURCHASING_GROUP": [aInputRows[0].PURCHASING_GROUP],
                "PURCHASING_DOCUMENT": [aInputRows[0].PURCHASING_DOCUMENT],
                "LOCAL_CONTENT": [aInputRows[0].LOCAL_CONTENT],
                "VALID_FROM": [aInputRows[0].VALID_FROM],
                "VALID_TO": [aInputRows[0].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[0].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[0].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[0].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[0].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[0].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[0].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[0].PRICE_UNIT_UOM_ID],
                "_VALID_FROM": [testData.oMaterialPrice._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterialPrice._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "material_price_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CMPR_BOOLEAN_INT_MANUAL": [aInputRows[0].CMPR_BOOLEAN_INT_MANUAL],
                    "CMPR_DECIMAL_MANUAL": [aInputRows[0].CMPR_DECIMAL_MANUAL],
                    "CMPR_DECIMAL_UNIT": [aInputRows[0].CMPR_DECIMAL_UNIT],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_MANUAL],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_UNIT],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_MANUAL],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_UNIT]
                }, ["CMPR_BOOLEAN_INT_MANUAL",  "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT",
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                ]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");

            let oImputRow = {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[4],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[4],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[4],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[4],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[4],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[4],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[4],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[4],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            };

            let aInputRows = [oImputRow, oImputRow];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
                let oExtendRow = {
                    "CMPR_BOOLEAN_INT_MANUAL": testData.oMaterialPriceExt.CMPR_BOOLEAN_INT_MANUAL[4],
                    "CMPR_DECIMAL_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_MANUAL[4],
                    "CMPR_DECIMAL_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_UNIT[4],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[4],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_UNIT[4],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_MANUAL[4],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_UNIT[4]
                };
                _.extend(aInputRows[0], oExtendRow);
                _.extend(aInputRows[1], oExtendRow);
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", 
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": testData.oMaterialPrice._SOURCE[3]
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[4],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[4],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[4],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[4],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[4],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[4],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[4],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[4],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": testData.oMaterialPrice._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "material_price_ext");
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": testData.oMaterialPriceExt.CMPR_BOOLEAN_INT_MANUAL[3],
                    "CMPR_DECIMAL_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_MANUAL[3],
                    "CMPR_DECIMAL_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_UNIT[3],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[3],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_UNIT[3],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_MANUAL[3],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_UNIT[3]
                });
                _.extend(aInputRows[1], {
                    "CMPR_BOOLEAN_INT_MANUAL": testData.oMaterialPriceExt.CMPR_BOOLEAN_INT_MANUAL[4],
                    "CMPR_DECIMAL_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_MANUAL[4],
                    "CMPR_DECIMAL_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_UNIT[4],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[4],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_UNIT[4],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_MANUAL[4],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_UNIT[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.MATERIAL_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if price source does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": '1234',
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_SOURCE_ID'],
                "FIELD_VALUE": [aInputRows[0].PRICE_SOURCE_ID],
                "MESSAGE_TEXT": ['Unknown Price Source ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if material does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": '1234',
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['MATERIAL_ID'],
                "FIELD_VALUE": [aInputRows[0].MATERIAL_ID],
                "MESSAGE_TEXT": ['Unknown Material ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if plant does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": '1234',
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PLANT_ID'],
                "FIELD_VALUE": [aInputRows[0].PLANT_ID],
                "MESSAGE_TEXT": ['Unknown Plant ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if vendor does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": '1234',
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VENDOR_ID'],
                "FIELD_VALUE": [aInputRows[0].VENDOR_ID],
                "MESSAGE_TEXT": ['Unknown Vendor ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if project does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": '1234',
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PROJECT_ID'],
                "FIELD_VALUE": [aInputRows[0].PROJECT_ID],
                "MESSAGE_TEXT": ['Unknown Project ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if customer does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": '1234',
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['CUSTOMER_ID'],
                "FIELD_VALUE": [aInputRows[0].CUSTOMER_ID],
                "MESSAGE_TEXT": ['Unknown Customer ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if currency does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": '123',
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['TRANSACTION_CURRENCY_ID'],
                "FIELD_VALUE": [aInputRows[0].TRANSACTION_CURRENCY_ID],
                "MESSAGE_TEXT": ['Unknown Currency ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if uom does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": 'AAA',
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_UNIT_UOM_ID'],
                "FIELD_VALUE": [aInputRows[0].PRICE_UNIT_UOM_ID],
                "MESSAGE_TEXT": ['Unknown Unit of Measure ID for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if VALID_FROM is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": null,
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VALID_FROM'],
                "FIELD_VALUE": [aInputRows[0].VALID_FROM],
                "MESSAGE_TEXT": ['Invalid Valid From for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if VALID_FROM_QUANTITY is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": null,
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['VALID_FROM_QUANTITY'],
                "FIELD_VALUE": [aInputRows[0].VALID_FROM_QUANTITY],
                "MESSAGE_TEXT": ['Invalid Valid From Quantity for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if PRICE_FIXED_PORTION is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": null,
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_FIXED_PORTION'],
                "FIELD_VALUE": [aInputRows[0].PRICE_FIXED_PORTION],
                "MESSAGE_TEXT": ['Invalid Price Fixed for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should not update a material price if PRICE_VARIABLE_PORTION is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": null,
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL",
                        "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                        "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_VARIABLE_PORTION'],
                "FIELD_VALUE": [aInputRows[0].PRICE_VARIABLE_PORTION],
                "MESSAGE_TEXT": ['Invalid Price Variable for Material ID '.concat(aInputRows[0].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }
        });

        it('should insert two material prices, update two, add error for eleven, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4], // 'MAT3'
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[2], // 'PL2'
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3], // 'MAT2'
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0], // 'PL1'
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[3],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[3],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[3],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[3],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[3],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[3],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[3],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[3],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[3],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 3
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[4],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[4],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[4],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[4],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[4],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[4],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[4],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[4],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[4],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2,
            }, {
                "PRICE_SOURCE_ID": 'AAAA',
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": 'BBBB',
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": 'CCCC',
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[1],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[1],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[1],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[1],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[1],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[1],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[1],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[1],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[1],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[1],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[1],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[1],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[1],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[1],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[1],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[1],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[1],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[1],
                "_SOURCE": testData.oMaterialPrice._SOURCE[1],
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": 'DDDD',
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": 'EEEE',
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": 'FFFF',
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": 'GGG',
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": 'HHH',
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": null,
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": null,
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oMaterialPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oMaterialPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oMaterialPrice.PRICE_SOURCE_ID[0],
                "MATERIAL_ID": testData.oMaterialPrice.MATERIAL_ID[0],
                "PLANT_ID": testData.oMaterialPrice.PLANT_ID[0],
                "VENDOR_ID": testData.oMaterialPrice.VENDOR_ID[0],
                "PROJECT_ID": testData.oMaterialPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oMaterialPrice.CUSTOMER_ID[0],
                "PURCHASING_GROUP": testData.oMaterialPrice.PURCHASING_GROUP[0],
                "PURCHASING_DOCUMENT": testData.oMaterialPrice.PURCHASING_DOCUMENT[0],
                "LOCAL_CONTENT": testData.oMaterialPrice.LOCAL_CONTENT[0],
                "VALID_FROM": testData.oMaterialPrice.VALID_FROM[0],
                "VALID_TO": testData.oMaterialPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oMaterialPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oMaterialPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": "0.0000000",
                "PRICE_VARIABLE_PORTION": "0.0000000",
                "TRANSACTION_CURRENCY_ID": testData.oMaterialPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oMaterialPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oMaterialPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let oExtendRow = {
                    "CMPR_BOOLEAN_INT_MANUAL": 1,
                    "CMPR_DECIMAL_MANUAL": "123.0000000",
                    "CMPR_DECIMAL_UNIT": null,
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": "321.0000000",
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": "EUR",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": "121.0000000",
                    "CMPR_DECIMAL_WITH_UOM_UNIT": "H"
                };
                _.extend(aInputRows[0], oExtendRow);
                _.extend(aInputRows[1], oExtendRow);
                _.extend(aInputRows[2], oExtendRow);
                _.extend(aInputRows[3], oExtendRow);
                _.extend(aInputRows[4], oExtendRow);
                _.extend(aInputRows[5], oExtendRow);
                _.extend(aInputRows[6], oExtendRow);
                _.extend(aInputRows[7], oExtendRow);
                _.extend(aInputRows[8], oExtendRow);
                _.extend(aInputRows[9], {
                    "CMPR_BOOLEAN_INT_MANUAL": testData.oMaterialPriceExt.CMPR_BOOLEAN_INT_MANUAL[1],
                    "CMPR_DECIMAL_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_MANUAL[1],
                    "CMPR_DECIMAL_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_UNIT[1],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_MANUAL[1],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_CURRENCY_UNIT[1],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_MANUAL[1],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": testData.oMaterialPriceExt.CMPR_DECIMAL_WITH_UOM_UNIT[1]
                });
                _.extend(aInputRows[10], oExtendRow);
                _.extend(aInputRows[11], oExtendRow);
                _.extend(aInputRows[12], oExtendRow);
                _.extend(aInputRows[13], oExtendRow);
                _.extend(aInputRows[14], oExtendRow);
                _.extend(aInputRows[15], oExtendRow);
                _.extend(aInputRows[16], oExtendRow);
                _.extend(aInputRows[17], oExtendRow);
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{material_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oMaterialPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(4);
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_price");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_SOURCE_ID', 'MATERIAL_ID', 'PLANT_ID', 'VENDOR_ID', 'PROJECT_ID', 'CUSTOMER_ID', 'TRANSACTION_CURRENCY_ID', 'PRICE_UNIT_UOM_ID', 'VALID_FROM', 'VALID_FROM_QUANTITY'],
                "FIELD_VALUE": [aInputRows[4].PRICE_SOURCE_ID, aInputRows[5].MATERIAL_ID, aInputRows[6].PLANT_ID, aInputRows[10].VENDOR_ID, aInputRows[11].PROJECT_ID, aInputRows[12].CUSTOMER_ID, aInputRows[13].TRANSACTION_CURRENCY_ID, aInputRows[14].PRICE_UNIT_UOM_ID, aInputRows[15].VALID_FROM, aInputRows[16].VALID_FROM_QUANTITY],
                "MESSAGE_TEXT": ['Unknown Price Source ID for Material ID '.concat(aInputRows[4].MATERIAL_ID),
                 'Unknown Material ID',
                  'Unknown Plant ID for Material ID '.concat(aInputRows[6].MATERIAL_ID),
                   'Unknown Vendor ID for Material ID '.concat(aInputRows[10].MATERIAL_ID),
                    'Unknown Project ID for Material ID '.concat(aInputRows[11].MATERIAL_ID),
                     'Unknown Customer ID for Material ID '.concat(aInputRows[12].MATERIAL_ID), 
                     'Unknown Currency ID for Material ID '.concat(aInputRows[13].MATERIAL_ID),
                      'Unknown Unit of Measure ID for Material ID '.concat(aInputRows[14].MATERIAL_ID),
                       'Invalid Valid From for Material ID '.concat(aInputRows[15].MATERIAL_ID),
                        'Invalid Valid From Quantity for Material ID '.concat(aInputRows[16].MATERIAL_ID)],
                "MESSAGE_TYPE": ['ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR'],
                "TABLE_NAME": ['t_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price', 't_material_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID, aInputRows[1].PRICE_SOURCE_ID, aInputRows[2].PRICE_SOURCE_ID, aInputRows[3].PRICE_SOURCE_ID],
                "MATERIAL_ID": [aInputRows[0].MATERIAL_ID, aInputRows[1].MATERIAL_ID, aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "PLANT_ID": [aInputRows[0].PLANT_ID, aInputRows[1].PLANT_ID, aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "VENDOR_ID": [aInputRows[0].VENDOR_ID, aInputRows[1].VENDOR_ID, aInputRows[2].VENDOR_ID, aInputRows[3].VENDOR_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID, aInputRows[1].PROJECT_ID, aInputRows[2].PROJECT_ID, aInputRows[3].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID, aInputRows[1].CUSTOMER_ID, aInputRows[2].CUSTOMER_ID, aInputRows[3].CUSTOMER_ID],
                "PURCHASING_GROUP": [aInputRows[0].PURCHASING_GROUP, aInputRows[1].PURCHASING_GROUP, aInputRows[2].PURCHASING_GROUP, aInputRows[3].PURCHASING_GROUP],
                "PURCHASING_DOCUMENT": [aInputRows[0].PURCHASING_DOCUMENT, aInputRows[1].PURCHASING_DOCUMENT, aInputRows[2].PURCHASING_DOCUMENT, aInputRows[3].PURCHASING_DOCUMENT],
                "LOCAL_CONTENT": [aInputRows[0].LOCAL_CONTENT, aInputRows[1].LOCAL_CONTENT, aInputRows[2].LOCAL_CONTENT, aInputRows[3].LOCAL_CONTENT],
                "VALID_FROM": [aInputRows[0].VALID_FROM, aInputRows[1].VALID_FROM, aInputRows[2].VALID_FROM, aInputRows[3].VALID_FROM],
                "VALID_TO": [aInputRows[0].VALID_TO, aInputRows[1].VALID_TO, aInputRows[2].VALID_TO, aInputRows[3].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[0].VALID_FROM_QUANTITY, aInputRows[1].VALID_FROM_QUANTITY, aInputRows[2].VALID_FROM_QUANTITY, aInputRows[3].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[0].VALID_TO_QUANTITY, aInputRows[1].VALID_TO_QUANTITY, aInputRows[2].VALID_TO_QUANTITY, aInputRows[3].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[0].PRICE_FIXED_PORTION, aInputRows[1].PRICE_FIXED_PORTION, aInputRows[2].PRICE_FIXED_PORTION, aInputRows[3].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[0].PRICE_VARIABLE_PORTION, aInputRows[1].PRICE_VARIABLE_PORTION, aInputRows[2].PRICE_VARIABLE_PORTION, aInputRows[3].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[0].TRANSACTION_CURRENCY_ID, aInputRows[1].TRANSACTION_CURRENCY_ID, aInputRows[2].TRANSACTION_CURRENCY_ID, aInputRows[3].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[0].PRICE_UNIT, aInputRows[1].PRICE_UNIT, aInputRows[2].PRICE_UNIT, aInputRows[3].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[0].PRICE_UNIT_UOM_ID, aInputRows[1].PRICE_UNIT_UOM_ID, aInputRows[2].PRICE_UNIT_UOM_ID, aInputRows[3].PRICE_UNIT_UOM_ID],
                "_VALID_TO": [null, null, null, null],
                "_SOURCE": [aInputRows[0]._SOURCE, aInputRows[1]._SOURCE, aInputRows[2]._SOURCE, aInputRows[3]._SOURCE],
                "_CREATED_BY": [sCurrentUser, sCurrentUser, sCurrentUser, sCurrentUser]
            }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{material_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[2].PRICE_SOURCE_ID, aInputRows[3].PRICE_SOURCE_ID],
                "MATERIAL_ID": [aInputRows[2].MATERIAL_ID, aInputRows[3].MATERIAL_ID],
                "PLANT_ID": [aInputRows[2].PLANT_ID, aInputRows[3].PLANT_ID],
                "VENDOR_ID": [aInputRows[2].VENDOR_ID, aInputRows[3].VENDOR_ID],
                "PROJECT_ID": [aInputRows[2].PROJECT_ID, aInputRows[3].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[2].CUSTOMER_ID, aInputRows[3].CUSTOMER_ID],
                "PURCHASING_GROUP": [aInputRows[2].PURCHASING_GROUP, aInputRows[3].PURCHASING_GROUP],
                "PURCHASING_DOCUMENT": [aInputRows[2].PURCHASING_DOCUMENT, aInputRows[3].PURCHASING_DOCUMENT],
                "LOCAL_CONTENT": [aInputRows[2].LOCAL_CONTENT, aInputRows[3].LOCAL_CONTENT],
                "VALID_FROM": [aInputRows[2].VALID_FROM, aInputRows[3].VALID_FROM],
                "VALID_TO": [aInputRows[2].VALID_TO, aInputRows[3].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[2].VALID_FROM_QUANTITY, aInputRows[3].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[2].VALID_TO_QUANTITY, aInputRows[3].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[2].PRICE_FIXED_PORTION, aInputRows[3].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[2].PRICE_VARIABLE_PORTION, aInputRows[3].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[2].TRANSACTION_CURRENCY_ID, aInputRows[3].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[2].PRICE_UNIT, aInputRows[3].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[2].PRICE_UNIT_UOM_ID, aInputRows[3].PRICE_UNIT_UOM_ID],
                "_VALID_FROM": [testData.oMaterialPrice._VALID_FROM[3], testData.oMaterialPrice._VALID_FROM[4]],
                "_SOURCE": [testData.oMaterialPrice._SOURCE[3], testData.oMaterialPrice._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{material_price}}
                where PRICE_SOURCE_ID in ('${aInputRows[7].PRICE_SOURCE_ID}', '${aInputRows[8].PRICE_SOURCE_ID}', '${aInputRows[9].PRICE_SOURCE_ID}')
                    and MATERIAL_ID in ('${aInputRows[7].MATERIAL_ID}', '${aInputRows[8].MATERIAL_ID}', '${aInputRows[9].MATERIAL_ID}')
                    and PLANT_ID in ('${aInputRows[7].PLANT_ID}', '${aInputRows[8].PLANT_ID}', '${aInputRows[9].PLANT_ID}')
                    and VENDOR_ID in ('${aInputRows[7].VENDOR_ID}', '${aInputRows[8].VENDOR_ID}', '${aInputRows[9].VENDOR_ID}')
                    and PROJECT_ID in ('${aInputRows[7].PROJECT_ID}', '${aInputRows[8].PROJECT_ID}', '${aInputRows[9].PROJECT_ID}')
                    and CUSTOMER_ID in ('${aInputRows[7].CUSTOMER_ID}', '${aInputRows[8].CUSTOMER_ID}', '${aInputRows[9].CUSTOMER_ID}')
                    and VALID_FROM in ('${aInputRows[7].VALID_FROM}', '${aInputRows[8].VALID_FROM}', '${aInputRows[9].VALID_FROM}')
                    and VALID_FROM_QUANTITY in ('${aInputRows[7].VALID_FROM_QUANTITY}', '${aInputRows[8].VALID_FROM_QUANTITY}', '${aInputRows[9].VALID_FROM_QUANTITY}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oMaterialPrice, [0, 1]), ["PRICE_ID", "PRICE_SOURCE_ID", "MATERIAL_ID", "PLANT_ID", "VENDOR_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "PURCHASING_GROUP", "PURCHASING_DOCUMENT", "LOCAL_CONTENT",
                    "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "material_price_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oMaterialPriceExt, ["PRICE_ID", "_VALID_FROM", "CMPR_BOOLEAN_INT_MANUAL",
                        "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT", "CMPR_DECIMAL_WITH_CURRENCY_MANUAL",
                        "CMPR_DECIMAL_WITH_CURRENCY_UNIT", "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                    ]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{material_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CMPR_BOOLEAN_INT_MANUAL": [aInputRows[0].CMPR_BOOLEAN_INT_MANUAL, aInputRows[1].CMPR_BOOLEAN_INT_MANUAL, aInputRows[2].CMPR_BOOLEAN_INT_MANUAL, aInputRows[3].CMPR_BOOLEAN_INT_MANUAL],
                    "CMPR_DECIMAL_MANUAL": [aInputRows[0].CMPR_DECIMAL_MANUAL, aInputRows[1].CMPR_DECIMAL_MANUAL, aInputRows[2].CMPR_DECIMAL_MANUAL, aInputRows[3].CMPR_DECIMAL_MANUAL],
                    "CMPR_DECIMAL_UNIT": [aInputRows[0].CMPR_DECIMAL_UNIT, aInputRows[1].CMPR_DECIMAL_UNIT, aInputRows[2].CMPR_DECIMAL_UNIT, aInputRows[3].CMPR_DECIMAL_UNIT],
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_MANUAL, aInputRows[1].CMPR_DECIMAL_WITH_CURRENCY_MANUAL, aInputRows[2].CMPR_DECIMAL_WITH_CURRENCY_MANUAL, aInputRows[3].CMPR_DECIMAL_WITH_CURRENCY_MANUAL],
                    "CMPR_DECIMAL_WITH_CURRENCY_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_CURRENCY_UNIT, aInputRows[1].CMPR_DECIMAL_WITH_CURRENCY_UNIT, aInputRows[2].CMPR_DECIMAL_WITH_CURRENCY_UNIT, aInputRows[3].CMPR_DECIMAL_WITH_CURRENCY_UNIT],
                    "CMPR_DECIMAL_WITH_UOM_MANUAL": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_MANUAL, aInputRows[1].CMPR_DECIMAL_WITH_UOM_MANUAL, aInputRows[2].CMPR_DECIMAL_WITH_UOM_MANUAL, aInputRows[3].CMPR_DECIMAL_WITH_UOM_MANUAL],
                    "CMPR_DECIMAL_WITH_UOM_UNIT": [aInputRows[0].CMPR_DECIMAL_WITH_UOM_UNIT, aInputRows[1].CMPR_DECIMAL_WITH_UOM_UNIT, aInputRows[2].CMPR_DECIMAL_WITH_UOM_UNIT, aInputRows[3].CMPR_DECIMAL_WITH_UOM_UNIT],
                }, ["CMPR_BOOLEAN_INT_MANUAL", "CMPR_DECIMAL_MANUAL", "CMPR_DECIMAL_UNIT",
                    "CMPR_DECIMAL_WITH_CURRENCY_MANUAL", "CMPR_DECIMAL_WITH_CURRENCY_UNIT",
                    "CMPR_DECIMAL_WITH_UOM_MANUAL", "CMPR_DECIMAL_WITH_UOM_UNIT"
                ]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}