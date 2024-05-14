async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sLayoutHiddenTable = 'sap.plc.db::basis.t_layout_hidden_field';

    try {
        await oConnection.executeUpdate(`update "${ sLayoutHiddenTable }" set COLUMN_ID ='LIFECYCLE_PERIOD_DESCRIPTION' 
        where PATH='CALCULATION_VERSION' and BUSINESS_OBJECT='Calculation_Version' and COLUMN_ID ='LIFECYCLE_PERIOD_FROM';`);
    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to update layout hidden field LIFECYCLE_PERIOD_FROM , Error: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {check,clean,run};
