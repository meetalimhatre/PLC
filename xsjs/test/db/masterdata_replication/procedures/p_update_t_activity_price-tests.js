const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const mockstarHelpers = require("../../../testtools/mockstar_helpers");
const testData = require("../../../testdata/testdata_replication").data;
const _ = require("lodash");

if (jasmine.plcTestRunParameters.mode === 'all') {

    describe('db.masterdata_replication:p_update_t_activity_price', function() {

        let oMockstarPlc = null;
        const sCurrentUser = $.session.getUsername();
        const sMasterdataTimestamp = NewDateAsISOString();

        beforeOnce(function() {

            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.masterdata_replication.procedures/p_update_t_activity_price", // procedure or view under test
                substituteTables: // substitute all used tables in the procedure or view
                {
                    activity_price: {
                        name: "sap.plc.db::basis.t_activity_price",
                        data: testData.oActivityPrice
                    },
                    activity_price_ext: {
                        name: "sap.plc.db::basis.t_activity_price_ext"
                    },
                    controlling_area: {
                        name: "sap.plc.db::basis.t_controlling_area",
                        data: testData.oControllingArea
                    },
                    cost_center: {
                        name: "sap.plc.db::basis.t_cost_center",
                        data: testData.oCostCenter
                    },
                    activity_type: {
                        name: "sap.plc.db::basis.t_activity_type",
                        data: testData.oActivityType
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
                oMockstarPlc.insertTableData("activity_price_ext", testData.oActivityPriceExt);
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

        it('should not create an activity price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");
            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure([]);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should create a new activity price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[4],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4], // '3000'
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[2], // 'CCC2'
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[4],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[4],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[4],
                "VALID_TO": testData.oActivityPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.PRICE_ID.rows.length).toEqual(0);
            }

            let aBeforeResults = oMockstarPlc.execQuery(`select * from {{activity_price}} 
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                and COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                and ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'`);
            expect(aBeforeResults.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_price");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
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
            }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_price_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CAPR_DECIMAL_MANUAL": [aInputRows[0].CAPR_DECIMAL_MANUAL],
                    "CAPR_DECIMAL_UNIT": [aInputRows[0].CAPR_DECIMAL_UNIT]
                }, ["CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]);
            }
        });

        it('should update an existing activity price', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[4],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[4],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[4],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[4],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[4],
                "VALID_TO": testData.oActivityPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(aBeforeResultsExt.columns.PRICE_ID.rows.length).toEqual(0);
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                and COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                and ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_TO is null`);
            expect(aResultsBefore.columns.CONTROLLING_AREA_ID.rows.length).toEqual(1);

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(1);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_price");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                and COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                and ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
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
            }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where PRICE_SOURCE_ID = '${aInputRows[0].PRICE_SOURCE_ID}'
                and CONTROLLING_AREA_ID = '${aInputRows[0].CONTROLLING_AREA_ID}'
                and COST_CENTER_ID = '${aInputRows[0].COST_CENTER_ID}'
                and ACTIVITY_TYPE_ID = '${aInputRows[0].ACTIVITY_TYPE_ID}'
                and PROJECT_ID = '${aInputRows[0].PROJECT_ID}'
                and CUSTOMER_ID = '${aInputRows[0].CUSTOMER_ID}'
                and VALID_FROM = '${aInputRows[0].VALID_FROM}'
                and VALID_FROM_QUANTITY = '${aInputRows[0].VALID_FROM_QUANTITY}'
                and _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID],
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID],
                "VALID_FROM": [aInputRows[0].VALID_FROM],
                "VALID_TO": [aInputRows[0].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[0].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[0].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[0].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[0].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[0].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[0].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[0].PRICE_UNIT_UOM_ID],
                "_VALID_FROM": [testData.oActivityPrice._VALID_FROM[4]],
                "_SOURCE": [testData.oActivityPrice._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser]
            }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 6, "activity_price_ext");
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CAPR_DECIMAL_MANUAL": [aInputRows[0].CAPR_DECIMAL_MANUAL],
                    "CAPR_DECIMAL_UNIT": [aInputRows[0].CAPR_DECIMAL_UNIT]
                }, ["CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]);
            }
        });

        it('should not do any update due to DUPLICATE_KEY_COUNT in the input table', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");

            let oImputRow = {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[4],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[4],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[4],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[4],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[4],
                "VALID_TO": testData.oActivityPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2
            };

            let aInputRows = [oImputRow, oImputRow];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
                let oExtendRow = {
                    "CAPR_DECIMAL_MANUAL": testData.oActivityPriceExt.CAPR_DECIMAL_MANUAL[4],
                    "CAPR_DECIMAL_UNIT": testData.oActivityPriceExt.CAPR_DECIMAL_UNIT[4]
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

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not do any insert / update since all data from input table already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");
            mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": testData.oActivityPrice._SOURCE[3]
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[4],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[4],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[4],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[4],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[4],
                "VALID_TO": testData.oActivityPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": testData.oActivityPrice._SOURCE[4]
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 5, "activity_price_ext");
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": testData.oActivityPriceExt.CAPR_DECIMAL_MANUAL[3],
                    "CAPR_DECIMAL_UNIT": testData.oActivityPriceExt.CAPR_DECIMAL_UNIT[3]
                });
                _.extend(aInputRows[1], {
                    "CAPR_DECIMAL_MANUAL": testData.oActivityPriceExt.CAPR_DECIMAL_MANUAL[4],
                    "CAPR_DECIMAL_UNIT": testData.oActivityPriceExt.CAPR_DECIMAL_UNIT[4]
                });
            }

            //act
            let procedure = oMockstarPlc.loadProcedure();
            let procreturn = procedure(aInputRows);

            //assert
            expect(procreturn.OV_PROCESSED_ROWS).toBe(0);
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(aResultsValidFrom.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(aResultsValidTo.columns.CONTROLLING_AREA_ID.rows.length).toEqual(0);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if price source does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": '1234',
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Unknown Price Source ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if controlling area does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": '1234',
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "FIELD_NAME": ['CONTROLLING_AREA_ID'],
                "FIELD_VALUE": [aInputRows[0].CONTROLLING_AREA_ID],
                "MESSAGE_TEXT": ['Unknown Controlling Area ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if cost center does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": '1234',
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "FIELD_NAME": ['COST_CENTER_ID'],
                "FIELD_VALUE": [aInputRows[0].COST_CENTER_ID],
                "MESSAGE_TEXT": ['Unknown Cost Center ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if activity type does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": '1234',
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "FIELD_NAME": ['ACTIVITY_TYPE_ID'],
                "FIELD_VALUE": [aInputRows[0].ACTIVITY_TYPE_ID],
                "MESSAGE_TEXT": ['Unknown Activity Type ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if project does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": '1234',
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Unknown Project ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if customer does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": '1234',
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Unknown Customer ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if currency does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": '123',
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Unknown Currency ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if uom does not exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": 'AAA',
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Unknown Unit of Measure ID'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if VALID_FROM is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": null,
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Invalid Valid From'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if VALID_FROM_QUANTITY is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": null,
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Invalid Valid From Quantity'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if PRICE_FIXED_PORTION is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": null,
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Invalid Price Fixed'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID",
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should not update an activity price if PRICE_VARIABLE_PORTION is null', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": null,
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                _.extend(aInputRows[0], {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
                });
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
                "MESSAGE_TEXT": ['Invalid Price Variable'],
                "MESSAGE_TYPE": ['ERROR'],
                "TABLE_NAME": ['t_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aMatchResults = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aMatchResults)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }
        });

        it('should insert two activity prices, update two, add error for eleven, skip two due to multiple input and skip one due to entry already exist', function() {
            //arrange
            mockstarHelpers.checkRowCount(oMockstarPlc, 0, "error");

            let aInputRows = [{
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4], // '3000'
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[2], // 'CCC2'
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3], // '2000'
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0], // 'CCC1'
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[3],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[3],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[3],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[3],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[3],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[3],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[3],
                "VALID_TO": testData.oActivityPrice.VALID_TO[3],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[3],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[3],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[3],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[3],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[3],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[3],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[3],
                "_SOURCE": 3
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[4],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[4],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[4],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[4],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[4],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[4],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[4],
                "VALID_TO": testData.oActivityPrice.VALID_TO[4],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[4],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[4],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[4],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[4],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[4],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[4],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[4],
                "_SOURCE": 2,
            }, {
                "PRICE_SOURCE_ID": 'AAAA',
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": 'BBBB',
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": 'CCCC',
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[1],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[1],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[1],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[1],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[1],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[1],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[1],
                "VALID_TO": testData.oActivityPrice.VALID_TO[1],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[1],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[1],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[1],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[1],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[1],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[1],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[1],
                "_SOURCE": testData.oActivityPrice._SOURCE[1],
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": 'DDDD',
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": 'EEEE',
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": 'FFFF',
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": 'GGG',
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": 'HHH',
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": null,
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": null,
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": testData.oActivityPrice.PRICE_FIXED_PORTION[0],
                "PRICE_VARIABLE_PORTION": testData.oActivityPrice.PRICE_VARIABLE_PORTION[0],
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }, {
                "PRICE_SOURCE_ID": testData.oActivityPrice.PRICE_SOURCE_ID[0],
                "CONTROLLING_AREA_ID": testData.oActivityPrice.CONTROLLING_AREA_ID[0],
                "COST_CENTER_ID": testData.oActivityPrice.COST_CENTER_ID[0],
                "ACTIVITY_TYPE_ID": testData.oActivityPrice.ACTIVITY_TYPE_ID[0],
                "PROJECT_ID": testData.oActivityPrice.PROJECT_ID[0],
                "CUSTOMER_ID": testData.oActivityPrice.CUSTOMER_ID[0],
                "VALID_FROM": testData.oActivityPrice.VALID_FROM[0],
                "VALID_TO": testData.oActivityPrice.VALID_TO[0],
                "VALID_FROM_QUANTITY": testData.oActivityPrice.VALID_FROM_QUANTITY[0],
                "VALID_TO_QUANTITY": testData.oActivityPrice.VALID_TO_QUANTITY[0],
                "PRICE_FIXED_PORTION": "0.0000000",
                "PRICE_VARIABLE_PORTION": "0.0000000",
                "TRANSACTION_CURRENCY_ID": testData.oActivityPrice.TRANSACTION_CURRENCY_ID[0],
                "PRICE_UNIT": testData.oActivityPrice.PRICE_UNIT[0],
                "PRICE_UNIT_UOM_ID": testData.oActivityPrice.PRICE_UNIT_UOM_ID[0],
                "_SOURCE": 2
            }];

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                let oExtendRow = {
                    "CAPR_DECIMAL_MANUAL": "123.0000000",
                    "CAPR_DECIMAL_UNIT": null
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
                    "CAPR_DECIMAL_MANUAL": testData.oActivityPriceExt.CAPR_DECIMAL_MANUAL[1],
                    "CAPR_DECIMAL_UNIT": testData.oActivityPriceExt.CAPR_DECIMAL_UNIT[1]
                });
                _.extend(aInputRows[10], oExtendRow);
                _.extend(aInputRows[11], oExtendRow);
                _.extend(aInputRows[12], oExtendRow);
                _.extend(aInputRows[13], oExtendRow);
                _.extend(aInputRows[14], oExtendRow);
                _.extend(aInputRows[15], oExtendRow);
                _.extend(aInputRows[16], oExtendRow);
                _.extend(aInputRows[17], oExtendRow);
                let aBeforeResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}`);
                expect(mockstarHelpers.convertResultToArray(aBeforeResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
            }

            let aResultsBefore = oMockstarPlc.execQuery(`select * from {{activity_price}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsBefore)).toMatchData(
                testData.oActivityPrice, ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
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
            mockstarHelpers.checkRowCount(oMockstarPlc, 9, "activity_price");

            let aResultsError = oMockstarPlc.execQuery(`select * from {{error}}`);
            expect(mockstarHelpers.convertResultToArray(aResultsError)).toMatchData({
                "FIELD_NAME": ['PRICE_SOURCE_ID', 'CONTROLLING_AREA_ID', 'COST_CENTER_ID', 'ACTIVITY_TYPE_ID', 'PROJECT_ID', 'CUSTOMER_ID', 'TRANSACTION_CURRENCY_ID', 'PRICE_UNIT_UOM_ID', 'VALID_FROM', 'VALID_FROM_QUANTITY'],
                "FIELD_VALUE": [aInputRows[4].PRICE_SOURCE_ID, aInputRows[5].CONTROLLING_AREA_ID, aInputRows[6].COST_CENTER_ID, aInputRows[10].ACTIVITY_TYPE_ID, aInputRows[11].PROJECT_ID, aInputRows[12].CUSTOMER_ID, aInputRows[13].TRANSACTION_CURRENCY_ID, aInputRows[14].PRICE_UNIT_UOM_ID, aInputRows[15].VALID_FROM, aInputRows[16].VALID_FROM_QUANTITY],
                "MESSAGE_TEXT": ['Unknown Price Source ID', 'Unknown Controlling Area ID', 'Unknown Cost Center ID', 'Unknown Activity Type ID', 'Unknown Project ID', 'Unknown Customer ID', 'Unknown Currency ID', 'Unknown Unit of Measure ID', 'Invalid Valid From', 'Invalid Valid From Quantity'],
                "MESSAGE_TYPE": ['ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR', 'ERROR'],
                "TABLE_NAME": ['t_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price', 't_activity_price']
            }, ["FIELD_NAME", "FIELD_VALUE", "MESSAGE_TEXT", "MESSAGE_TYPE", "TABLE_NAME"]);

            let aResultsValidFrom = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_FROM > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidFrom)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[0].PRICE_SOURCE_ID, aInputRows[1].PRICE_SOURCE_ID, aInputRows[2].PRICE_SOURCE_ID, aInputRows[3].PRICE_SOURCE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[0].CONTROLLING_AREA_ID, aInputRows[1].CONTROLLING_AREA_ID, aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "COST_CENTER_ID": [aInputRows[0].COST_CENTER_ID, aInputRows[1].COST_CENTER_ID, aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "ACTIVITY_TYPE_ID": [aInputRows[0].ACTIVITY_TYPE_ID, aInputRows[1].ACTIVITY_TYPE_ID, aInputRows[2].ACTIVITY_TYPE_ID, aInputRows[3].ACTIVITY_TYPE_ID],
                "PROJECT_ID": [aInputRows[0].PROJECT_ID, aInputRows[1].PROJECT_ID, aInputRows[2].PROJECT_ID, aInputRows[3].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[0].CUSTOMER_ID, aInputRows[1].CUSTOMER_ID, aInputRows[2].CUSTOMER_ID, aInputRows[3].CUSTOMER_ID],
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
            }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_TO", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsValidTo = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where _VALID_TO > '${sMasterdataTimestamp}'`);
            expect(mockstarHelpers.convertResultToArray(aResultsValidTo)).toMatchData({
                "PRICE_SOURCE_ID": [aInputRows[2].PRICE_SOURCE_ID, aInputRows[3].PRICE_SOURCE_ID],
                "CONTROLLING_AREA_ID": [aInputRows[2].CONTROLLING_AREA_ID, aInputRows[3].CONTROLLING_AREA_ID],
                "COST_CENTER_ID": [aInputRows[2].COST_CENTER_ID, aInputRows[3].COST_CENTER_ID],
                "ACTIVITY_TYPE_ID": [aInputRows[2].ACTIVITY_TYPE_ID, aInputRows[3].ACTIVITY_TYPE_ID],
                "PROJECT_ID": [aInputRows[2].PROJECT_ID, aInputRows[3].PROJECT_ID],
                "CUSTOMER_ID": [aInputRows[2].CUSTOMER_ID, aInputRows[3].CUSTOMER_ID],
                "VALID_FROM": [aInputRows[2].VALID_FROM, aInputRows[3].VALID_FROM],
                "VALID_TO": [aInputRows[2].VALID_TO, aInputRows[3].VALID_TO],
                "VALID_FROM_QUANTITY": [aInputRows[2].VALID_FROM_QUANTITY, aInputRows[3].VALID_FROM_QUANTITY],
                "VALID_TO_QUANTITY": [aInputRows[2].VALID_TO_QUANTITY, aInputRows[3].VALID_TO_QUANTITY],
                "PRICE_FIXED_PORTION": [aInputRows[2].PRICE_FIXED_PORTION, aInputRows[3].PRICE_FIXED_PORTION],
                "PRICE_VARIABLE_PORTION": [aInputRows[2].PRICE_VARIABLE_PORTION, aInputRows[3].PRICE_VARIABLE_PORTION],
                "TRANSACTION_CURRENCY_ID": [aInputRows[2].TRANSACTION_CURRENCY_ID, aInputRows[3].TRANSACTION_CURRENCY_ID],
                "PRICE_UNIT": [aInputRows[2].PRICE_UNIT, aInputRows[3].PRICE_UNIT],
                "PRICE_UNIT_UOM_ID": [aInputRows[2].PRICE_UNIT_UOM_ID, aInputRows[3].PRICE_UNIT_UOM_ID],
                "_VALID_FROM": [testData.oActivityPrice._VALID_FROM[3], testData.oActivityPrice._VALID_FROM[4]],
                "_SOURCE": [testData.oActivityPrice._SOURCE[3], testData.oActivityPrice._SOURCE[4]],
                "_CREATED_BY": [sCurrentUser, sCurrentUser]
            }, ["PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                "_VALID_FROM", "_SOURCE", "_CREATED_BY"
            ]);

            let aResultsSkip = oMockstarPlc.execQuery(`select * from {{activity_price}}
                where PRICE_SOURCE_ID in ('${aInputRows[7].PRICE_SOURCE_ID}', '${aInputRows[8].PRICE_SOURCE_ID}', '${aInputRows[9].PRICE_SOURCE_ID}')
                    and CONTROLLING_AREA_ID in ('${aInputRows[7].CONTROLLING_AREA_ID}', '${aInputRows[8].CONTROLLING_AREA_ID}', '${aInputRows[9].CONTROLLING_AREA_ID}')
                    and COST_CENTER_ID in ('${aInputRows[7].COST_CENTER_ID}', '${aInputRows[8].COST_CENTER_ID}', '${aInputRows[9].COST_CENTER_ID}')
                    and ACTIVITY_TYPE_ID in ('${aInputRows[7].ACTIVITY_TYPE_ID}', '${aInputRows[8].ACTIVITY_TYPE_ID}', '${aInputRows[9].ACTIVITY_TYPE_ID}')
                    and PROJECT_ID in ('${aInputRows[7].PROJECT_ID}', '${aInputRows[8].PROJECT_ID}', '${aInputRows[9].PROJECT_ID}')
                    and CUSTOMER_ID in ('${aInputRows[7].CUSTOMER_ID}', '${aInputRows[8].CUSTOMER_ID}', '${aInputRows[9].CUSTOMER_ID}')
                    and VALID_FROM in ('${aInputRows[7].VALID_FROM}', '${aInputRows[8].VALID_FROM}', '${aInputRows[9].VALID_FROM}')
                    and VALID_FROM_QUANTITY in ('${aInputRows[7].VALID_FROM_QUANTITY}', '${aInputRows[8].VALID_FROM_QUANTITY}', '${aInputRows[9].VALID_FROM_QUANTITY}')`);
            expect(mockstarHelpers.convertResultToArray(aResultsSkip)).toMatchData(
                pickFromTableData(testData.oActivityPrice, [0, 1]), ["PRICE_ID", "PRICE_SOURCE_ID", "CONTROLLING_AREA_ID", "COST_CENTER_ID", "ACTIVITY_TYPE_ID",
                    "PROJECT_ID", "CUSTOMER_ID", "VALID_FROM", "VALID_TO", "VALID_FROM_QUANTITY", "VALID_TO_QUANTITY",
                    "PRICE_FIXED_PORTION", "PRICE_VARIABLE_PORTION", "TRANSACTION_CURRENCY_ID",
                    "PRICE_UNIT", "PRICE_UNIT_UOM_ID", 
                    "_VALID_FROM", "_VALID_TO", "_SOURCE", "_CREATED_BY"
                ]
            );

            if (jasmine.plcTestRunParameters.generatedFields === true) {
                mockstarHelpers.checkRowCount(oMockstarPlc, 9, "activity_price_ext");
                let aMatchResultsExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM < '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aMatchResultsExt)).toMatchData(
                    testData.oActivityPriceExt, ["PRICE_ID", "_VALID_FROM", "CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]
                );
                let aResultsValidFromExt = oMockstarPlc.execQuery(`select * from {{activity_price_ext}}
                    where _VALID_FROM > '${sMasterdataTimestamp}'`);
                expect(mockstarHelpers.convertResultToArray(aResultsValidFromExt)).toMatchData({
                    "CAPR_DECIMAL_MANUAL": [aInputRows[0].CAPR_DECIMAL_MANUAL, aInputRows[1].CAPR_DECIMAL_MANUAL, aInputRows[2].CAPR_DECIMAL_MANUAL, aInputRows[3].CAPR_DECIMAL_MANUAL],
                    "CAPR_DECIMAL_UNIT": [aInputRows[0].CAPR_DECIMAL_UNIT, aInputRows[1].CAPR_DECIMAL_UNIT, aInputRows[2].CAPR_DECIMAL_UNIT, aInputRows[3].CAPR_DECIMAL_UNIT]
                }, ["CAPR_DECIMAL_MANUAL", "CAPR_DECIMAL_UNIT"]);
            }
        });

    }).addTags(["All_Unit_Tests", "CF_Unit_Tests"]);
}