async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sLanguageTable = 'sap.plc.db::basis.t_language';

    try {
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.TEXTS_MAINTAINABLE='1' WHERE t_lang.LANGUAGE='PT';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.TEXTS_MAINTAINABLE='1' WHERE t_lang.LANGUAGE='RU';`);

    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to set value for mapping language id: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {check,clean,run};
