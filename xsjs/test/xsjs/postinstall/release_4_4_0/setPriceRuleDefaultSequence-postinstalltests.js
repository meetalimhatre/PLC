const sPriceDetStrategyRuleTable = "sap.plc.db::basis.t_price_determination_strategy_rule";
const sPriceDetStrategyTable = "sap.plc.db::basis.t_price_determination_strategy";
var mockstar_helpers = require("../../../testtools/mockstar_helpers");
var oConnection = null;
var sPriceDetStrategyId = "PLC_STANDARD";

describe("Sets Price Rule default sequence", () => {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        var oPriceDetStrategyRule = [
            [sPriceDetStrategyId, 1, "NEW",               1],
            [sPriceDetStrategyId, 1, "PLANT",             2],
            [sPriceDetStrategyId, 1, "VENDOR",            3],
            [sPriceDetStrategyId, 1, "PROJECT",           4],
            [sPriceDetStrategyId, 1, "CUSTOMER",          5],
            [sPriceDetStrategyId, 2, "CONTROLLING_AREA",  1],
            [sPriceDetStrategyId, 2, "NEW",               2],
            [sPriceDetStrategyId, 2, "COST_CENTER",       3],
            [sPriceDetStrategyId, 2, "ACTIVITY_TYPE",     4],
            [sPriceDetStrategyId, 2, "PROJECT",           5],
            [sPriceDetStrategyId, 2, "CUSTOMER",          6],
            
        ];

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sPriceDetStrategyRuleTable}"`);
            oConnection.executeUpdate(`INSERT INTO "${sPriceDetStrategyRuleTable}" ("PRICE_DETERMINATION_STRATEGY_ID", "PRICE_DETERMINATION_STRATEGY_TYPE_ID", "RULE_CODE", "PRIORITY")
                                       VALUES (?, ?, ?, ?)`, oPriceDetStrategyRule);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should set price rules to t_price_determination_strategy_rule table", () => {

            // arrange
            var oDbBefore = oConnection.executeQuery(`SELECT * FROM "${sPriceDetStrategyTable}"`);
            oDbBefore = mockstar_helpers.convertResultToArray(oDbBefore);
            let sum = 0;
            oDbBefore.PRICE_DETERMINATION_STRATEGY_TYPE_ID.forEach(row=>{
                sum += row === 1 ? 5 : 6;
            });
            var oResultFromDb = oConnection.executeQuery(`SELECT * FROM "${sPriceDetStrategyRuleTable}"`);
            expect(oResultFromDb.length).toEqual(sum);

            oConnection.commit();
        });
    }
}); 