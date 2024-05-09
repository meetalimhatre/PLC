const MockstarFacade = require("../../../testtools/mockstar_facade").MockstarFacade;
const AddEntityToProject = $.import("xs.postinstall.release_4_1_0", "addEntityToProject");
const oTestData = require("../../../testdata/testdata").data;
const sEntityIdSequence = "sap.plc.db.sequence::s_entity_id";

describe("AddEntityToProject-tests", () => {
    let oMockstar = null;
    beforeOnce(() => {
        oMockstar = new MockstarFacade({
            substituteTables: {
                project: "sap.plc.db::basis.t_project",
                entity_relation: "sap.plc.db::basis.t_entity_relation",
            },
        });
    });

    beforeEach(() => {
        oMockstar.clearAllTables();
        oMockstar.initializeData();
    });

    xit("should update the project table with a new column", () => {
        // arrange
        const oProject = oTestData.oProjectTestData;
        //Get the next value from the entity id sequence
        const sCurrentSchema = jasmine.dbConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
        const iSequenceEntityId = parseInt(jasmine.dbConnection.executeQuery(`SELECT "${sCurrentSchema}"."${sEntityIdSequence}".NEXTVAL FROM "sap.plc.db::DUMMY"`)[0]['sap.plc.db.sequence::s_entity_id.NEXTVAL']);
        //Use the actual sequence for the expected data
        const oProjectExpected = JSON.parse(JSON.stringify(oProject));
        oProjectExpected.ENTITY_ID = [iSequenceEntityId + 1, iSequenceEntityId + 2, iSequenceEntityId + 3];

        oMockstar.insertTableData("project", oProject);
        oMockstar.execSingle(`UPDATE {{project}} SET ENTITY_ID = 0`);
        jasmine.dbConnection.commit();

        // act
        AddEntityToProject.run(jasmine.dbConnection);

        // assert
        const oProjectAfter = oMockstar.execQuery(`select ENTITY_ID from {{project}}`);
        const oEntityRelationAfter = oMockstar.execQuery(`select ENTITY_ID from {{entity_relation}}`);
        expect(oProjectAfter.columns.ENTITY_ID.rows).toEqual(oProjectExpected.ENTITY_ID);
        expect(oEntityRelationAfter.columns.ENTITY_ID.rows).toEqual(oProjectExpected.ENTITY_ID);
    });
}).addTags(["All_Unit_Tests"]);
