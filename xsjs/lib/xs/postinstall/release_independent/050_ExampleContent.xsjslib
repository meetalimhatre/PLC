const whoAmI = 'sap.plc.init:050_ExampleContent';

async function check(oConnection) {
    return true;
}

async function run(oConnection) {
    console.log('start insert sample data');
    var procedure = oConnection.loadProcedure('sap.plc.init::050_ExampleContent');
    procedure();
    console.log('finish insert sample data');
    console.log('start get calculation version');
    var calVersionId = await oConnection.executeQuery(`SELECT CALCULATION_VERSION_ID FROM "sap.plc.db::basis.t_calculation_version"`);
    if (calVersionId !== null && calVersionId.length) {
        try {
            procedure = oConnection.loadProcedure(`sap.plc.db.calcengine.procedures::p_calculate_saved_calculation_version`);
            calVersionId.forEach(function (versionId) {
                procedure(versionId['CALCULATION_VERSION_ID']);
            });
            console.log('finish get calculation version');
            return true;
        } catch (e) {
            console.log('error:', e.message);
            throw new Error(`calculate save version error: ${ e.message }`);
        }
    } else {
        throw new Error(`the saved version number is null`);
    }

    return true;
}

async function clean(oConnection) {

    //The Run is either committed as a unit or rolled back, hence their is no dirty data.
    return true;
}
export default {whoAmI,check,run,clean};
