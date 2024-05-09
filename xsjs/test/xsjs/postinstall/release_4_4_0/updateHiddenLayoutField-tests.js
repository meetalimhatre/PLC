const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const updateHiddenLayoutField = $.import("xs.postinstall.release_4_4_0", "updateHiddenLayoutField");

const oLayoutHiddenFieldTestData ={
    "LAYOUT_ID" : [1, 2, 3, 4],
    "PATH" :["CALCULATION_VERSION","TEST","CALCULATION_VERSION","CALCULATION_VERSION"],
    "BUSINESS_OBJECT": ["Calculation_Version","Calculation_Version","test","Calculation_Version"],
    "COLUMN_ID" : ["","","", ""] 
}

describe("updateHiddenLayoutField-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                layoutHiddenFields :{
                    name : "sap.plc.db::basis.t_layout_hidden_field",
                    data : oLayoutHiddenFieldTestData
                }
            }
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    it("should update COLUMN_ID with value LIFECYCLE_PERIOD_DESCRIPTION instead of LIFECYCLE_PERIOD_FROM",() => {
        
        //arrange
        oMockstar.execSingle(`update {{layoutHiddenFields}} set COLUMN_ID='LIFECYCLE_PERIOD_FROM' where LAYOUT_ID in (1,2,3)`);
        oMockstar.execSingle(`update {{layoutHiddenFields}} set COLUMN_ID='test' where LAYOUT_ID = 4`);
        var oResultFromDbBefore = oMockstar.execQuery(`select LAYOUT_ID,PATH,BUSINESS_OBJECT,COLUMN_ID from {{layoutHiddenFields}}`);
       
        //act
        updateHiddenLayoutField.run(jasmine.dbConnection);

        //assert
        var oResultFromDb = oMockstar.execQuery(`select LAYOUT_ID,PATH,BUSINESS_OBJECT,COLUMN_ID from {{layoutHiddenFields}}`)

        expect(oResultFromDbBefore).toMatchData({
            "LAYOUT_ID" : [1, 2, 3, 4], 
            "PATH" :["CALCULATION_VERSION","TEST","CALCULATION_VERSION","CALCULATION_VERSION"],
            "BUSINESS_OBJECT": ["Calculation_Version","Calculation_Version","test","Calculation_Version"],
            "COLUMN_ID" : ["LIFECYCLE_PERIOD_FROM","LIFECYCLE_PERIOD_FROM","LIFECYCLE_PERIOD_FROM", "test"] 
        },["LAYOUT_ID","PATH","BUSINESS_OBJECT","COLUMN_ID"]);

        expect(oResultFromDb).toMatchData({
            "LAYOUT_ID" : [1, 2, 3, 4], 
            "PATH" :["CALCULATION_VERSION","TEST","CALCULATION_VERSION","CALCULATION_VERSION"],
            "BUSINESS_OBJECT": ["Calculation_Version","Calculation_Version","test","Calculation_Version"],
            "COLUMN_ID" : ["LIFECYCLE_PERIOD_DESCRIPTION","LIFECYCLE_PERIOD_FROM","LIFECYCLE_PERIOD_FROM", "test"] 
        },["LAYOUT_ID","PATH","BUSINESS_OBJECT","COLUMN_ID"]);
    });

}).addTags(["All_Unit_Tests"]);;