/* Script to convert chinese language identifier from ZH-CN to ZH-HANS and from ZH-TW to ZH-HANT*/


const whoAmI = 'sap.plc.init:110_ERP_PriceSources';

function check(oConnection) {
    return true;
}

async function run(oConnection) {
    await console.log('start insert ERP price data');
    var procedure = oConnection.loadProcedure('sap.plc.init::110_ERP_PriceSources');
    procedure();
    await console.log('finish insert ERP price data');
    return true;
}

function clean(oConnection) {

    //The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
export default {whoAmI,check,run,clean};
