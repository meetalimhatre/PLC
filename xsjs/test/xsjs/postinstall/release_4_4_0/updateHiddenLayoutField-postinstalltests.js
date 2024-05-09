var mockstar_helpers = require("../../../testtools/mockstar_helpers");

const sLayoutHiddenTable = "sap.plc.db::basis.t_layout_hidden_field";    
var oConnection = null;

describe("Update layout hidden fields from LIFECYCLE_PERIOD_FROM to LIFECYCLE_PERIOD_DESCRIPTION", ()=> {

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });
    
    if (jasmine.plcTestRunParameters.mode === "prepare") {
        const oHiddenFieldsTestData = [
            [1, "CALCULATION_VERSION","Calculation_Version","LIFECYCLE_PERIOD_FROM"],
            [2, "test","Calculation_Version","LIFECYCLE_PERIOD_FROM"],
            [3, "CALCULATION_VERSION","test","LIFECYCLE_PERIOD_FROM"],
            [4, "CALCULATION_VERSION","Calculation_Version","test"]
        ];        

        it("Prepare the testdata", () => {
            oConnection.executeUpdate(`DELETE from "${sLayoutHiddenTable}" where LAYOUT_ID in (1, 2, 3, 4);`);           

            oConnection.executeUpdate(`INSERT INTO "${sLayoutHiddenTable}" (LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID)
            VALUES (?, ?, ?, ?);`, oHiddenFieldsTestData);
            
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update COLUMN_ID with value LIFECYCLE_PERIOD_DESCRIPTION instead of LIFECYCLE_PERIOD_FROM",()=> {
           let oResultFromDb = oConnection.executeQuery(`select LAYOUT_ID, PATH, BUSINESS_OBJECT, COLUMN_ID from "${sLayoutHiddenTable}" where LAYOUT_ID in (1,2,3,4);`);
            oResultFromDb = mockstar_helpers.convertResultToArray(oResultFromDb);
            expect(oResultFromDb).toMatchData({
                "LAYOUT_ID" : [1, 2, 3, 4], 
                "PATH" :["CALCULATION_VERSION","test","CALCULATION_VERSION","CALCULATION_VERSION"],
                "BUSINESS_OBJECT": ["Calculation_Version","Calculation_Version","test","Calculation_Version"],
                "COLUMN_ID" : ["LIFECYCLE_PERIOD_DESCRIPTION","LIFECYCLE_PERIOD_FROM","LIFECYCLE_PERIOD_FROM", "test"] 
            },["LAYOUT_ID","PATH","BUSINESS_OBJECT","COLUMN_ID"]);
            
            oConnection.executeUpdate(`DELETE from "${sLayoutHiddenTable}" where LAYOUT_ID in (1, 2, 3, 4);`);           
            oConnection.commit();
        });
    }

});