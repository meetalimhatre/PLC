const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const setPriceRuleDefaultSequence = $.import("xs.postinstall.release_4_4_0", "setPriceRuleDefaultSequence");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("setPriceRuleDefaultSequence-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                price_determination_strategy_rule: {
                    name: "sap.plc.db::basis.t_price_determination_strategy_rule",
                    data: testdata.oPriceDeterminationStrategyRuleActivityATFirstNewSec
                },
                price_determination_strategy:{
                    name: "sap.plc.db::basis.t_price_determination_strategy",
                    data: testdata.oPriceDeterminationStrategyTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should set default priority sequence", () => {
        // arrange
        var oDbBefore = oMockstar.execQuery(`SELECT * FROM {{price_determination_strategy}}`);
        // act
        setPriceRuleDefaultSequence.run(jasmine.dbConnection);
        // assert
        let sum = 0;
        oDbBefore.columns.PRICE_DETERMINATION_STRATEGY_TYPE_ID.rows.forEach(row=>{
            sum += row === 1 ? 5 : 6;
        });
        var oResultFromDb = oMockstar.execQuery(`SELECT * FROM {{price_determination_strategy_rule}}`);
        expect(oResultFromDb.columns.PRIORITY.rows.length).toEqual(sum);
    })}).addTags(["All_Unit_Tests"]); 