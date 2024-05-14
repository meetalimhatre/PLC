const whoAmI = 'sap.plc.init:030_StandardContent';

async function check(oConnection) {
    return true;
}

async function run(oConnection) {
    console.log('start insert standard data');
    var procedure = oConnection.loadProcedure('sap.plc.init::030_StandardContent');
    procedure();
    console.log('finish insert standard data');
    return true;
}

async function clean(oConnection) {

    //The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
export default {whoAmI,check,run,clean};
