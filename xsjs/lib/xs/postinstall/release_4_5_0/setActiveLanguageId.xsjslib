function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

function run(oConnection) {

    const sLanguageTable = "sap.plc.db::basis.t_language";

    try {
        oConnection.executeUpdate(`UPDATE "${sLanguageTable}" as t_lang SET t_lang.TEXTS_MAINTAINABLE='1' WHERE t_lang.LANGUAGE='PT';`);
        oConnection.executeUpdate(`UPDATE "${sLanguageTable}" as t_lang SET t_lang.TEXTS_MAINTAINABLE='1' WHERE t_lang.LANGUAGE='RU';`);

    } catch (e) {
        console.log("error:", e.message);
        throw new Error(`Failed to set value for mapping language id: ${e.message}`);
    }

    oConnection.commit();
    return true;
}
