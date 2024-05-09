const resetSequence = $.import("xs.postinstall.release_4_0_0", "reset_sequence");
const oConnection = resetSequence.oConnection;
const testSequence = "sap.plc.db.sequence::s_calculation";
const sXSCSchema = "SAP_PLC";
let aSequences;


describe("test reset sequences number", () => {
    beforeAll(() => {
        jasmine.dbConnection.executeUpdate('SET TRANSACTION AUTOCOMMIT DDL off');
        aSequences = [
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_variant_id"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_task_id"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_rule_id"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_layout"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_frontend_settings"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_formula"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_overhead_row"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_overhead"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_costing_sheet_base"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_calculation_version"},
            {SEQUENCE_NAME: "sap.plc.db.sequence::s_calculation"}
        ];
    });

    it("test update current squence from existing sequence", () => {
        let oMockConnection = {executeQuery: {}};
        spyOn(resetSequence, 'getConnection').and.returnValue(oMockConnection);
        spyOn(oMockConnection, "executeQuery").and.callFake((arg) =>{
            if (arg === `SELECT SEQUENCE_NAME FROM "SYS"."M_SEQUENCES" WHERE "SCHEMA_NAME" = '${sXSCSchema}'`) {
                return aSequences;
            }else {
                return [{NEWID: 500}];
            }
        });
        resetSequence.run(jasmine.dbConnection);
        let resultIndex = jasmine.dbConnection.executeQuery(`SELECT "${testSequence}".nextval as newid FROM DUMMY`)[0].NEWID;
        expect(parseInt(resultIndex)).toBe(500);
    });
}).addTags(["All_Unit_Tests"]);