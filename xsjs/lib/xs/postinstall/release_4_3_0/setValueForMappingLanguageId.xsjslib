const constants = $.require('../../util/constants');

function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sLanguageTable = 'sap.plc.db::basis.t_language';

    try {
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='0' WHERE t_lang.LANGUAGE='SR';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='1' WHERE t_lang.LANGUAGE='ZH-HANS';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='2' WHERE t_lang.LANGUAGE='TH';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='3' WHERE t_lang.LANGUAGE='KO';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='4' WHERE t_lang.LANGUAGE='RO';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='5' WHERE t_lang.LANGUAGE='SL';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='6' WHERE t_lang.LANGUAGE='HR';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='7' WHERE t_lang.LANGUAGE='MS';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='8' WHERE t_lang.LANGUAGE='UK';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='9' WHERE t_lang.LANGUAGE='ET';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='A' WHERE t_lang.LANGUAGE='AR';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='B' WHERE t_lang.LANGUAGE='HE';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='C' WHERE t_lang.LANGUAGE='CS';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='D' WHERE t_lang.LANGUAGE='DE';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='E' WHERE t_lang.LANGUAGE='EN';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='G' WHERE t_lang.LANGUAGE='EL';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='H' WHERE t_lang.LANGUAGE='HU';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='J' WHERE t_lang.LANGUAGE='JA-JP';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='K' WHERE t_lang.LANGUAGE='DA';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='L' WHERE t_lang.LANGUAGE='PL';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='M' WHERE t_lang.LANGUAGE='ZH-HANT';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='N' WHERE t_lang.LANGUAGE='NL';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='O' WHERE t_lang.LANGUAGE='NO';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='P' WHERE t_lang.LANGUAGE='PT';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='Q' WHERE t_lang.LANGUAGE='SK';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='R' WHERE t_lang.LANGUAGE='RU';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='T' WHERE t_lang.LANGUAGE='TR';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='U' WHERE t_lang.LANGUAGE='FI';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='V' WHERE t_lang.LANGUAGE='SV';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='W' WHERE t_lang.LANGUAGE='BG';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='X' WHERE t_lang.LANGUAGE='LT';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='Y' WHERE t_lang.LANGUAGE='LV';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='a' WHERE t_lang.LANGUAGE='AF';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='b' WHERE t_lang.LANGUAGE='IS';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='c' WHERE t_lang.LANGUAGE='CA';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='i' WHERE t_lang.LANGUAGE='ID';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='F',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='FR';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='S',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='ES';`);
        oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='I',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='IT';`);

    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Failed to set value for mapping language id: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {constants,check,clean,run};
