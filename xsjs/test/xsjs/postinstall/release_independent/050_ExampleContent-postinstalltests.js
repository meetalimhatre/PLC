const sXSCSchema = "SAP_PLC";
const sCostCenterTable = "sap.plc.db::basis.t_cost_center";
//the test data comes from t_cost_center.csv, it need to be updated if csv file changes.
const oCSVCostCenterData = {//primary key: COST_CENTER_ID, CONTROLLING_AREA_ID, _VALID_FROM
    COST_CENTER_ID: "#CC6",
    CONTROLLING_AREA_ID: "#CA2",
    _VALID_FROM: "2000-01-01T00:00:00.000Z",
    _VALID_TO: null,
    _SOURCE: 1,
    _CREATED_BY: "#CONTROLLER"
};

describe("test sample cost center data insert", () => {
    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("compare sample cost center data", ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        COST_CENTER_ID, 
                        CONTROLLING_AREA_ID, 
                        _VALID_FROM, 
                        _VALID_TO, 
                        _SOURCE, 
                        _CREATED_BY
                    FROM   
                        "${sCostCenterTable}" 
                    WHERE 
                        COST_CENTER_ID = '${oCSVCostCenterData["COST_CENTER_ID"]}'
                    AND
                        CONTROLLING_AREA_ID = '${oCSVCostCenterData["CONTROLLING_AREA_ID"]}'
                    AND
                        _VALID_FROM = '${oCSVCostCenterData["_VALID_FROM"]}'`);
            transferQueryValue(oResult[0]);
            expect(oResult[0]).toMatchData(oCSVCostCenterData, Object.keys(oResult[0]));
        });
    }
});

function transferQueryValue(oResult) {
    if (oResult) {
        Object.keys(oResult).forEach((sColumn) => {
            if (sColumn === "_VALID_FROM") {
                oResult[sColumn] = oResult[sColumn].toJSON();
            }  
        })
    } 
}