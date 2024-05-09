const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const SetValueForDeterminedAccountId = $.import("xs.postinstall.hotfix_4_2_3", "setValueForDeterminedAccountId");
const testdata = require("../../../testdata/testdata").data;
const _ = require("lodash");

describe("setValueForDeterminedAccountId-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                item: {
                    name: "sap.plc.db::basis.t_item",
                    data: testdata.oItemTestData
                }
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should change the value of determined_account_id to account_id's value", () => {
        // arrange

        // act
        SetValueForDeterminedAccountId.run(jasmine.dbConnection);
        // assert
        var oDeterminedAccountIdItem = oMockstar.execQuery(`select determined_account_id from {{item}}`);
        expect(oDeterminedAccountIdItem.columns.DETERMINED_ACCOUNT_ID.rows.length).toBe(5);
        expect(oDeterminedAccountIdItem.columns.DETERMINED_ACCOUNT_ID.rows).toEqual(["0", "0", "625000", "0", "0"]);
    });

}).addTags(["All_Unit_Tests"]);