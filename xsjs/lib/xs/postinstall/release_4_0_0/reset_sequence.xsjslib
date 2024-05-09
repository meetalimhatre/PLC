const sXSCSchema = "SAP_PLC";
var oConnection = null;


//check if sqlcc configuration is ok
function check(oCurrentConnection){
    try{
        oConnection = $.hdb.getConnection({"sqlcc": "xsjs.sqlcc_config", "pool": true, "treatDateAsUTC" : true});
        return true;
    } catch(e) {
        throw(e);
    }
}

function run(oCurrentConnection) {
    //get all sequence in PLC XSC version
    let oConnection = getConnection();
    let aSequences = oConnection.executeQuery(`SELECT SEQUENCE_NAME FROM "SYS"."M_SEQUENCES" WHERE "SCHEMA_NAME" = '${sXSCSchema}'`);
    let sCurrentSchema = getCurrentSchema(oCurrentConnection);
    aSequences.forEach(element => {
         //get each sequence current number in PLC XSC version
        let iSequenceValue = oConnection.executeQuery(`SELECT "${sXSCSchema}"."${element.SEQUENCE_NAME}".nextval as newid FROM DUMMY`)[0].NEWID;
        //update each sequence current number to XSA version
         oCurrentConnection.executeUpdate(`ALTER SEQUENCE "${sCurrentSchema}"."${element.SEQUENCE_NAME}" RESTART WITH ${iSequenceValue}`);
    });
    return true;
}

function getConnection() {
    return oConnection;
}

function getCurrentSchema(oCurrentConnection) {
    return oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

function clean(oCurrentConnection) {
    closeSqlConnection(oConnection)
    return true;
}
