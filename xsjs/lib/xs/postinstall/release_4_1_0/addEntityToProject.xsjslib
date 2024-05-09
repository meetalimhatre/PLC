const sProjectTable = "sap.plc.db::basis.t_project";
const sEntityRelationTable = "sap.plc.db::basis.t_entity_relation";
const sEntityIdSequence = "sap.plc.db.sequence::s_entity_id";

function check(oConnection) {
    return true;
}

function getCurrentSchemaName(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
}

function run(oConnection) {
    const sCurrentSchema = getCurrentSchemaName(oConnection);

    //Step 1 - update project: generate ENTITY_ID values for all projects
    oConnection.executeUpdate(`UPDATE "${sCurrentSchema}"."${sProjectTable}" SET ENTITY_ID = "${sCurrentSchema}"."${sEntityIdSequence}".NEXTVAL;`);

    //Step 2 - update entity relation: add all projects on the root location.
    oConnection.executeUpdate(`INSERT INTO "${sCurrentSchema}"."${sEntityRelationTable}" 
                                SELECT "ENTITY_ID",
	                            null as PARENT_ENTITY_ID,
	                            'P' as ENTITY_TYPE
                                FROM "${sCurrentSchema}"."${sProjectTable}";`);

    //Step 3 - remove the default value 0 from ENTITY_ID
    oConnection.executeUpdate(`ALTER TABLE "${sCurrentSchema}"."${sProjectTable}" ALTER ("ENTITY_ID" INTEGER DEFAULT NULL);`);

    oConnection.commit();

    return true;
}

function clean(oConnection) {
    return true;
}