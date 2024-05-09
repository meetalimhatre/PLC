const sProjectTable = "sap.plc.db::basis.t_project";
const sEntityRelationTable = "sap.plc.db::basis.t_entity_relation";
const sEntityIdSequence = "sap.plc.db.sequence::s_entity_id";
const oPrj = require("../../../testdata/testdata").data.oProjectTestData;
let oConnection = null;

describe("Add Entity To Project", () => {
    const sCurrentSchema = jasmine.dbConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
    const oProjectTestData = [
        [oPrj.PROJECT_ID[0],0,oPrj.CONTROLLING_AREA_ID[0],oPrj.REPORT_CURRENCY_ID[0],oPrj.LIFECYCLE_PERIOD_INTERVAL[0],oPrj.CREATED_BY[0],oPrj.LAST_MODIFIED_ON[0],oPrj.LAST_MODIFIED_BY[0]],
        [oPrj.PROJECT_ID[1],0,oPrj.CONTROLLING_AREA_ID[1],oPrj.REPORT_CURRENCY_ID[1],oPrj.LIFECYCLE_PERIOD_INTERVAL[1],oPrj.CREATED_BY[1],oPrj.LAST_MODIFIED_ON[1],oPrj.LAST_MODIFIED_BY[1]],
        [oPrj.PROJECT_ID[2],0,oPrj.CONTROLLING_AREA_ID[2],oPrj.REPORT_CURRENCY_ID[2],oPrj.LIFECYCLE_PERIOD_INTERVAL[2],oPrj.CREATED_BY[2],oPrj.LAST_MODIFIED_ON[2],oPrj.LAST_MODIFIED_BY[2]]
    ]

    beforeOnce(() => {
        oConnection = $.hdb.getConnection({ "sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC": true });
    });

    if (jasmine.plcTestRunParameters.mode === "prepare") {
        it("Prepare the project table", () => {
            oConnection.executeUpdate(`INSERT INTO "${sProjectTable}" (PROJECT_ID, ENTITY_ID, CONTROLLING_AREA_ID, REPORT_CURRENCY_ID, LIFECYCLE_PERIOD_INTERVAL, CREATED_BY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, oProjectTestData);
            oConnection.commit();
        });
    }

    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("should update the project table with a new column", () => {
            const iSequenceEntityId = parseInt(oConnection.executeQuery(`SELECT "${sCurrentSchema}"."${sEntityIdSequence}".NEXTVAL FROM "sap.plc.db::DUMMY"`)[0]['sap.plc.db.sequence::s_entity_id.NEXTVAL']);
            let aProjectAfter = oConnection.executeQuery(`SELECT ENTITY_ID FROM "${sProjectTable}"`);
            aProjectAfter = aProjectAfter.map(iValue => parseInt(iValue.ENTITY_ID));
            let aEntityRelationAfter = oConnection.executeQuery(`SELECT ENTITY_ID FROM "${sEntityRelationTable}"`);
            aEntityRelationAfter = aEntityRelationAfter.map(iValue => parseInt(iValue.ENTITY_ID));
            expect(aProjectAfter).toEqual([iSequenceEntityId -3, iSequenceEntityId - 2, iSequenceEntityId - 1]);
            expect(aEntityRelationAfter[3]).toEqual(aProjectAfter[0]);
            expect(aEntityRelationAfter[4]).toEqual(aProjectAfter[1]);
            expect(aEntityRelationAfter[5]).toEqual(aProjectAfter[2]);
        });
    }

});