const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const testData = require("../../../testdata/testdata").data;
const sDefaultExchangeRateType = require("../../../../lib/xs/util/constants").sDefaultExchangeRateType;

if (jasmine.plcTestRunParameters.mode === "all") {
    describe("db.calculationmanager:p_get_uom_exchange_currency", () => {
        let oMockstarPlc = null;
        const sMasterdataTimestamp = new Date().toJSON();
        const sLanguage = "EN";

        beforeOnce(() => {
            oMockstarPlc = new MockstarFacade({
                testmodel: "sap.plc.db.calculationmanager.procedures/p_get_uom_exchange_currency",
                substituteTables:
                    {
                        currency: {
                            name: "sap.plc.db::basis.t_currency",
                            data: testData.mCsvFiles.currency,
                        },
                        unit_of_measure: {
                            name: "sap.plc.db::basis.t_uom",
                            data: testData.mCsvFiles.uom,
                        },
                        exchange_rate_type: {
                            name: "sap.plc.db::basis.t_exchange_rate_type",
                            data: testData.mCsvFiles.exchange_rate_type,
                        },
                    },
            });
        });
        beforeEach(() => {
            oMockstarPlc.clearAllTables(); // clear all specified substitute tables and views
            oMockstarPlc.initializeData();
        });

        afterEach(() => {
        });

        it("should return unit of measures and currencies", () => {
            // act
            const procedure = oMockstarPlc.loadProcedure();
            const oUom = { UOM_ID: "PC", MASTER_DATA_TIMESTAMP: sMasterdataTimestamp };
            const oCurrency = { CURRENCY_ID: "EUR", MASTER_DATA_TIMESTAMP: sMasterdataTimestamp };
            const result = procedure(sLanguage, [oUom], [oCurrency], []);

            // assert
            expect(Array.from(result.OT_UOM).length).toBe(1);
            expect(Array.slice(result.OT_UOM[0])).not.toBe(null);
            expect(result.OT_UOM[0].UOM_ID).toBe(oUom.UOM_ID);

            expect(Array.from(result.OT_CURRENCY).length).toBe(1);
            expect(Array.slice(result.OT_CURRENCY[0])).not.toBe(null);
            expect(result.OT_CURRENCY[0].CURRENCY_ID).toBe(oCurrency.CURRENCY_ID);
            expect(result.OT_EXCHANGE_RATE_TYPE[0]).not.toBeDefined();
        });

        it("should return exchange rate types", () => {
            // act
            const procedure = oMockstarPlc.loadProcedure();
            const result = procedure(sLanguage, [], [], [{ EXCHANGE_RATE_TYPE_ID: sDefaultExchangeRateType }]);
            // assert
            expect(Array.from(result.OT_EXCHANGE_RATE_TYPE).length).toBe(1);
            expect(Array.from(result.OT_EXCHANGE_RATE_TYPE[0])).not.toBe(null);
            expect(result.OT_EXCHANGE_RATE_TYPE[0].EXCHANGE_RATE_TYPE_ID).toBe(sDefaultExchangeRateType);
        });
        it("should not return UOMS that do not exist", () => {
            // act
            const oInvalidUom = { UOM_ID: "WWW", MASTER_DATA_TIMESTAMP: sMasterdataTimestamp };
            const procedure = oMockstarPlc.loadProcedure();
            const result = procedure(sLanguage, [oInvalidUom], [], []);
            // assert
            expect(Array.from(result.OT_UOM).length).toBe(0);
        });
        it("should not return currencies that do not exist", () => {
            // act
            const oInvalidCurrency = { CURRENCY_ID: "WWW", MASTER_DATA_TIMESTAMP: sMasterdataTimestamp };
            const procedure = oMockstarPlc.loadProcedure();
            const result = procedure(sLanguage, [], [oInvalidCurrency], []);
            // assert
            expect(Array.from(result.OT_CURRENCY).length).toBe(0);
        });
        it("should not return exchange rate types that do not exist", () => {
            // act
            const procedure = oMockstarPlc.loadProcedure();
            const result = procedure(sLanguage, [], [], [{ EXCHANGE_RATE_TYPE_ID: "BUY" }]);
            // assert
            expect(Array.from(result.OT_EXCHANGE_RATE_TYPE).length).toBe(0);
        });
    }).addTags(["All_Unit_Tests"]);
}
