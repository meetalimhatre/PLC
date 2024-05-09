const sXSCSchema = "SAP_PLC";
const sUOMTable = "sap.plc.db::basis.t_uom";
//the test data comes from t_uom.csv, it need to be updated if csv file changes.
const oCSVUOMData = {
    UOM_ID: "PC",
    DIMENSION_ID: "NONE",
    NUMERATOR: 1,
    DENOMINATOR: 1,
    EXPONENT_BASE10: 0,
    SI_CONSTANT: "0.000000",
    _VALID_FROM: "2000-01-01T00:00:00.000Z",
    _VALID_TO: null,
    _SOURCE: 1,
    _CREATED_BY: "#CONTROLLER"
};

describe("test UOM data insert", () => {
    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("compare UOM data", ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        UOM_ID,
                        DIMENSION_ID,
                        NUMERATOR,
                        DENOMINATOR,
                        EXPONENT_BASE10,
                        SI_CONSTANT,
                        _VALID_FROM,
                        _VALID_TO,
                        _SOURCE,
                        _CREATED_BY
                    FROM   
                        "${sUOMTable}" 
                    WHERE 
                        UOM_ID = '${oCSVUOMData["UOM_ID"]}'
                    AND
                        _VALID_FROM = '${oCSVUOMData["_VALID_FROM"]}'`);
            transferQueryValue(oResult[0]);
            expect(oResult[0]).toMatchData(oCSVUOMData, Object.keys(oResult[0]));
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