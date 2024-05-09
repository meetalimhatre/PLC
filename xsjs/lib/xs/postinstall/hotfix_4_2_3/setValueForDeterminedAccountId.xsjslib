function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

async function run(oConnection) {
    const sItemTable = 'sap.plc.db::basis.t_item';

    try {
        oConnection.executeUpdate(`
           UPDATE "${ sItemTable }" 
           SET DETERMINED_ACCOUNT_ID = ACCOUNT_ID
         `);
    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Failed to set value for determined account id.: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {check,clean,run};