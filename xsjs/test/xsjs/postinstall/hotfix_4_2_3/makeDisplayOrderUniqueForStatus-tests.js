const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const MakeDisplayOrderUnqiueForStatus = $.import("xs.postinstall.hotfix_4_2_3", "makeDisplayOrderUniqueForStatus");
const _ = require("lodash");

var dDate = '2014-04-01T00:00:00.000Z';
var sUser = 'user';

describe("makeDisplayOrderUniqueForStatus-tests", () => {

    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                status: "sap.plc.db::basis.t_status"
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();

    });

    it("should make DISPLAY_ORDER  unique for statuses when they have equal values", () => {
        // arrange
        var oStatusTestData = {
            "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT','T1','T2','T3','T4','T5','T6'],
            "IS_DEFAULT":[1,0,0,0,0,0,0,0,0,0],
            "IS_ACTIVE":[1,0,1,0,1,0,1,0,1,0,1,0],
            "IS_STATUS_COPYABLE":[1,0,0,1,1,0,0,1,1,0],
            "DISPLAY_ORDER":[1,3,3,3,4,4,4,4,9,10],
            "CREATED_ON":[dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate],
            "CREATED_BY":[sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser],
            "LAST_MODIFIED_ON":[,,,,,,,,,],
            "LAST_MODIFIED_BY":[,,,,,,,,,]
        };
        oMockstar.clearTable('status');
        oMockstar.insertTableData('status', oStatusTestData);

        // act
        MakeDisplayOrderUnqiueForStatus.run(jasmine.dbConnection);

        // assert
        const sTestUser = $.session.getUsername();
        var oExpectedStatuses = {
            "STATUS_ID": ['ACTIVE','DRAFT','INACTIVE','PENDING','T1','T2','T3','T4','T5','T6'],
            "DISPLAY_ORDER": [1,3,4,5,6,7,8,9,10,11],
            "LAST_MODIFIED_BY": [sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser,sTestUser]
        };
        var oUpdatedStatuses = oMockstar.execQuery(`select STATUS_ID,DISPLAY_ORDER,LAST_MODIFIED_BY from {{status}} ORDER BY DISPLAY_ORDER,STATUS_ID ASC`);
        expect(oUpdatedStatuses).toMatchData(oExpectedStatuses, ["STATUS_ID"]);

    });

    it("should not change display order for statuses if they are already unique", () => {
        // arrange
        var oStatusTestData = {
            "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT','T1','T2','T3','T4','T5','T6'],
            "IS_DEFAULT":[1,0,0,0,0,0,0,0,0,0],
            "IS_ACTIVE":[1,0,1,0,1,0,1,0,1,0,1,0],
            "IS_STATUS_COPYABLE":[1,0,0,1,1,0,0,1,1,0],
            "DISPLAY_ORDER":[1,2,3,4,5,6,7,8,9,10],
            "CREATED_ON":[dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate,dDate],
            "CREATED_BY":[sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser,sUser],
            "LAST_MODIFIED_ON":[,,,,,,,,,],
            "LAST_MODIFIED_BY":[,,,,,,,,,]
        };
        oMockstar.clearTable('status');
        oMockstar.insertTableData('status', oStatusTestData);

        // act
        MakeDisplayOrderUnqiueForStatus.run(jasmine.dbConnection);

        // assert
        var oExpectedStatuses = {
            "STATUS_ID":['ACTIVE','INACTIVE','PENDING','DRAFT','T1','T2','T3','T4','T5','T6'],
            "DISPLAY_ORDER":[1,2,3,4,5,6,7,8,9,10],
            "LAST_MODIFIED_BY":[null,null,null,null,null,null,null,null,null,null]
        };
        var oUpdatedStatuses = oMockstar.execQuery(`select STATUS_ID,DISPLAY_ORDER,LAST_MODIFIED_BY from {{status}} ORDER BY DISPLAY_ORDER,STATUS_ID ASC`);
        expect(oUpdatedStatuses).toMatchData(oExpectedStatuses, ["STATUS_ID"]);
    });

}).addTags(["All_Unit_Tests"]); 