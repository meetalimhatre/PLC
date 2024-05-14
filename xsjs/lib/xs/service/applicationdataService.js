const _ = require('lodash');
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;
const BusinessObjectsEntities = require('../util/masterdataResources').BusinessObjectsEntities;

/************************************************************************
 * Contains common functions for handling application data.
 ***********************************************************************
 */

/**
 * Gets the available languages.
 * 
 * @param {string} sLanguage - the language passed in URL
 * @param {object} oPersistency - instance of persistency
 * @return {array} aLanguage - the array containing the supported languages
 */
module.exports.getLanguages = async function (sLanguage, oPersistency) {
    let oParameters = {};
    let aLanguages = [];

    oParameters.business_object = BusinessObjectTypes.Language;
    oParameters.filter = 'TEXTS_MAINTAINABLE=1';
    var aLanguagesLong = oPersistency.Administration.getAdministration(oParameters, sLanguage, new Date())[BusinessObjectsEntities.LANGUAGE_ENTITIES];

    _.each(aLanguagesLong, function (oLanguageLong) {
        var oLanguageShort = {};
        oLanguageShort = _.pick(oLanguageLong, 'LANGUAGE', 'TEXTS_MAINTAINABLE');
        aLanguages.push(oLanguageShort);
    });

    return aLanguages;
};
export default {_,BusinessObjectTypes,BusinessObjectsEntities};
