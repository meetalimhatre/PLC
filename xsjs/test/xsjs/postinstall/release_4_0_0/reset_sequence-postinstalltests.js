const sXSCSchema = "SAP_PLC";
const aSequences = [
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_variant_id", VALUE: 10},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_task_id", VALUE: 20},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_rule_id", VALUE: 30},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_layout", VALUE: 40},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_frontend_settings", VALUE: 50},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_formula", VALUE: 60},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_overhead_row", VALUE: 70},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_overhead", VALUE: 80},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_base", VALUE: 90},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_calculation_version", VALUE: 100},
    {SEQUENCE_NAME: "sap.plc.db.sequence::s_calculation", VALUE: 110}
];
var oConnection = null;

describe('resume sequences number in XSC to XSA', ()=>{
    beforeAll(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    afterAll(() => {
        if (oConnection) {
            oConnection.close();
        }
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it ("insert sequence value to XSC", () => {
            aSequences.forEach((oSequence) => {
                oConnection.executeUpdate(`ALTER SEQUENCE "${sXSCSchema}"."${oSequence.SEQUENCE_NAME}" RESTART WITH ${oSequence.VALUE}`);
            })
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it ("check sequence value to XSA", () => {
            aSequences.forEach((oSequence) => {
                let iSeqNumber = oConnection.executeUpdate(`SELECT "${oSequence.SEQUENCE_NAME}".nextval as newid FROM DUMMY`)[0].NEWID;
                expect(iSeqNumber).toEqual(oSequence.VALUE);
            });
        });
    }
});