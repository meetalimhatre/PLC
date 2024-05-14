const constants = $.require('../../util/constants');

async function check(oConnection) {
    return true;
}

async function clean(oConnection) {
    return true;
}

async function run(oConnection) {

    const sLanguageTable = 'sap.plc.db::basis.t_language';

    try {
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='0' WHERE t_lang.LANGUAGE='SR';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='1' WHERE t_lang.LANGUAGE='ZH-HANS';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='2' WHERE t_lang.LANGUAGE='TH';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='3' WHERE t_lang.LANGUAGE='KO';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='4' WHERE t_lang.LANGUAGE='RO';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='5' WHERE t_lang.LANGUAGE='SL';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='6' WHERE t_lang.LANGUAGE='HR';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='7' WHERE t_lang.LANGUAGE='MS';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='8' WHERE t_lang.LANGUAGE='UK';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='9' WHERE t_lang.LANGUAGE='ET';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='A' WHERE t_lang.LANGUAGE='AR';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='B' WHERE t_lang.LANGUAGE='HE';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='C' WHERE t_lang.LANGUAGE='CS';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='D' WHERE t_lang.LANGUAGE='DE';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='E' WHERE t_lang.LANGUAGE='EN';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='G' WHERE t_lang.LANGUAGE='EL';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='H' WHERE t_lang.LANGUAGE='HU';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='J' WHERE t_lang.LANGUAGE='JA-JP';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='K' WHERE t_lang.LANGUAGE='DA';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='L' WHERE t_lang.LANGUAGE='PL';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='M' WHERE t_lang.LANGUAGE='ZH-HANT';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='N' WHERE t_lang.LANGUAGE='NL';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='O' WHERE t_lang.LANGUAGE='NO';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='P' WHERE t_lang.LANGUAGE='PT';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='Q' WHERE t_lang.LANGUAGE='SK';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='R' WHERE t_lang.LANGUAGE='RU';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='T' WHERE t_lang.LANGUAGE='TR';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='U' WHERE t_lang.LANGUAGE='FI';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='V' WHERE t_lang.LANGUAGE='SV';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='W' WHERE t_lang.LANGUAGE='BG';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='X' WHERE t_lang.LANGUAGE='LT';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='Y' WHERE t_lang.LANGUAGE='LV';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='a' WHERE t_lang.LANGUAGE='AF';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='b' WHERE t_lang.LANGUAGE='IS';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='c' WHERE t_lang.LANGUAGE='CA';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='i' WHERE t_lang.LANGUAGE='ID';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='F',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='FR';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='S',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='ES';`);
        await oConnection.executeUpdate(`UPDATE "${ sLanguageTable }" as t_lang SET t_lang.MAPPING_LANGUAGE_ID='I',t_lang.TEXTS_MAINTAINABLE=1 WHERE t_lang.LANGUAGE='IT';`);

    } catch (e) {
        console.log('error:', e.message);
        throw new Error(`Failed to set value for mapping language id: ${ e.message }`);
    }

    await oConnection.commit();
    return true;
}
export default {constants,check,clean,run};
