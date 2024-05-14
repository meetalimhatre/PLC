const sXSCSchema = 'SAP_PLC';
var oConnection = null;


//check if sqlcc configuration is ok
async function check(oCurrentConnection) {
    try {
        oConnection = await $.hdb.getConnection({
            'sqlcc': 'xsjs.sqlcc_config',
            'pool': true,
            'treatDateAsUTC': true
        });
        return true;
    } catch (e) {
        throw e;
    }
}

async function run(oCurrentConnection) {
    //get all sequence in PLC XSC version
    let oConnection = getConnection();
    let aSequences = await oConnection.executeQuery(`SELECT SEQUENCE_NAME FROM "SYS"."M_SEQUENCES" WHERE "SCHEMA_NAME" = '${ sXSCSchema }'`);
    let sCurrentSchema = await getCurrentSchema(oCurrentConnection);
    aSequences.forEach(element => {
        //get each sequence current number in PLC XSC version
        let iSequenceValue = (await oConnection.executeQuery(`SELECT "${ sXSCSchema }"."${ element.SEQUENCE_NAME }".nextval as newid FROM DUMMY`))[0].NEWID;
        //update each sequence current number to XSA version
        await oCurrentConnection.executeUpdate(`ALTER SEQUENCE "${ sCurrentSchema }"."${ element.SEQUENCE_NAME }" RESTART WITH ${ iSequenceValue }`);
    });
    return true;
}

function getConnection() {
    return oConnection;
}

async function getCurrentSchema(oCurrentConnection) {
    return await oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

async function clean(oCurrentConnection) {
    closeSqlConnection(oConnection);
    return true;
}
export default {sXSCSchema,oConnection,check,run,getConnection,getCurrentSchema,closeSqlConnection,clean};
