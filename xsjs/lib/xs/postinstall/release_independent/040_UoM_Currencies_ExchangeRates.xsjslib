const whoAmI = 'sap.plc.init:040_UoM_Currencies_ExchangeRates';

function check(oConnection) {
    return true;
}

async function run(oConnection) {
    console.log('start insert UOM data');
    var procedure = await oConnection.loadProcedure('sap.plc.init::040_UoM_Currencies_ExchangeRates');
    await procedure();
    console.log('finish insert UOM data');
    return true;
}

function clean(oConnection) {

    //The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
export default {whoAmI,check,run,clean};
