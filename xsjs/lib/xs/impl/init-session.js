const _ = require('lodash');
const Constants = require('../util/constants');
const helpers = require('../util/helpers');
const MetadataProvider = require('../metadata/metadataProvider').MetadataProvider;
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;
const BusinessObjectsEntities = require('../util/masterdataResources').BusinessObjectsEntities;
const Resources = require('../util/masterdataResources').MasterdataResource;
const ApplicationDataService = require('../service/applicationdataService');

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;


module.exports.InitSession = async function ($) {

    /**
 * Handle requests for init session. If GET request with the parameter "language" has been obtained, the session data
 * are written into database. After that the basic data are retrieved from the database for the given language and
 * returned as http response. All other request type are not allowed and response with error in that case.
 * 
 * @param {object}
 *            oRequest - the $.request object. Possible parameters: , "language" (mandatory) - the language code as Iso
 *            code, e.g. "de" "mandator" (optional) - the mandators id (in German: mandant id), e.g. "000"
 * @param {object}
 *            oValidator - the validator instance used for the request
 * @param {string}
 *            sSessionId - the current session id taken from hana
 * @param {string}
 *            sUsername - the user name taken from hana
 */

    var metadataProvider = await new MetadataProvider();

    this.init = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        var sUserId = $.getPlcUsername();
        var sSessionId = $.getPlcUsername();

        // get the supported language code
        var sLanguage = aParameters.language;

        var aLanguages = ApplicationDataService.getLanguages(sLanguage, oPersistency);

        var oLanguage = _.find(aLanguages, { LANGUAGE: sLanguage });
        if (helpers.isNullOrUndefined(oLanguage)) {
            const sLogMessage = `Language parameter is not supported: ${ sLanguage }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.LOGON_LANGUAGE_NOT_SUPPORTED_ERROR, sLogMessage);
        }
        var sIsoLanguage = oLanguage.LANGUAGE;

        oPersistency.Session.releaseLockTable(BusinessObjectTypes.Metadata);

        // TODO: check if the user is allowed to open the session. Make it after the security concept has been defined.
        // (discussed with Christian).
        // take over old session
        oPersistency.Session.updateSessionForOpenCalculationVersion(sSessionId, sUserId);
        // insert or update old session data
        oPersistency.Session.upsertSession(sSessionId, sUserId, sIsoLanguage);

        var sClientId = await tryGetClientId(aParameters);
        var oBasicData = await getBasicData(aLanguages, sIsoLanguage, sClientId, oPersistency);

        var sVersionId = oPersistency.ApplicationManagement.getApplicationVersion(MTA_METADATA);

        // check if dynamic DB artefacts for custom fields have been initialized for this DU version
        var bPlcState = oPersistency.ApplicationManagement.isPlcInitialized(sVersionId);
        if (!bPlcState) {
            // system has not been initialized or with a wrong version
            const sLogMessage = 'PLC has not been initialized correctly after installation or upgrade.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.PLC_NOT_INITIALIZED_ERROR, sLogMessage);
        }

        oBasicData.APPLICATION = {};
        oBasicData.APPLICATION[Constants.ServiceMetaInformation.ServerVersion] = sVersionId;

        // check if PLC_ALL_USERS exists and assign the current user to it
        const sDefaultUserGroup = 'PLC_ALL_USERS';
        const aDefaultUserGroup = [sDefaultUserGroup].map(group => `'${ group }'`).join(',');
        if (oPersistency.Group.getGroups(aDefaultUserGroup).length > 0) {
            const aMembersDetails = oPersistency.Group.getGroupMembers(sDefaultUserGroup).USERS;
            const aMemberIds = aMembersDetails.map(oUser => oUser.USER_ID);
            if (aMemberIds.indexOf(sUserId) === -1) {
                oUserToBeAdded = {
                    USER_ID: sUserId,
                    GROUP_ID: sDefaultUserGroup
                };
                oPersistency.Group.insertUserMembership([oUserToBeAdded]);
            }
        }

        oServiceOutput.setBody(oBasicData);
    };

    /**
	 * Tries to retrieves the clientId from the client HTTP parameter. If the client parameter is not defined, a default
	 * is returned
	 * 
	 * @return {string} sClientId - the provided clientID or default 000
	 */

    function tryGetClientId(aParameters) {
        var sClientId = aParameters.client;
        if (sClientId === undefined) {
            // TODO: replace this hard coded checking of mandators with checking based on database
            // when the concept of mandators has been introduced
            sClientId = '000';
        }
        return sClientId;
    }

    /**
	 * Get basic master data from database, including currencies, system messages, units of measure and metadata
	 * 
	 * @param {string}
	 *            sIsoLanguage - the user language as language code used PLC (e.g. "en" for english)
	 * @param {string}
	 *            sClientId - the mandant ID
	 * @return {object} oBasicData - the array with basic data
	 */
    async function getBasicData(aLanguages, sIsoLanguage, sClientId, oPersistency) {
        var sUserId = $.getPlcUsername();
        var sSessionId = $.getPlcUsername();

        // Read data for currencies, system messages, uoms
        var aSystemMessages = oPersistency.Misc.getSystemMessages(sIsoLanguage);
        var aCurrencies = await getCurrency(sIsoLanguage, oPersistency);
        var aUnitsOfMeasure = await getUnitOfMeasures(sIsoLanguage, oPersistency);

        // reset persistency schema to the default schema
        oPersistency.Misc.setHQuery(oPersistency.getHQueryPlc());
        var aGroups = oPersistency.Misc.getSidePanelGroups();

        // prepare final output: introduce properties
        var oBasicData = {};
        oBasicData.LANGUAGES = aLanguages;
        oBasicData.CURRENCIES = aCurrencies;
        oBasicData.SYSTEMMESSAGES = aSystemMessages;
        oBasicData.UNITSOFMEASURE = aUnitsOfMeasure;
        oBasicData.METADATA = metadataProvider.get(null, null, null, null, oPersistency, sSessionId, sUserId);
        oBasicData.GROUPS = aGroups;
        oBasicData.CURRENTUSER = {
            ID: sUserId,
            HIDE_ADMIN_VIEW: $.session.hasAppPrivilege('HdAdmV') ? 1 : 0
        };

        return oBasicData;
    }

    /**
	 * Gets the available currencies.
	 * 
	 * @param {string}
	 *            sIsoLanguage - the user language as language code used PLC (e.g. "en" for english)
	 * @param oPersistency   {object}  - instance of persistency
	 * 
	 * @return {array} aCurrency - the array containing all the currencies
	 */
    async function getCurrency(sIsoLanguage, oPersistency) {
        var oParameters = {}, aCurrency = [];

        oParameters.business_object = BusinessObjectTypes.Currency;
        var sAvailableLanguage = oPersistency.Misc.determineAvailableLanguage(Resources[oParameters.business_object].dbobjects.plcTextTable, sIsoLanguage);

        if (!helpers.isNullOrUndefined(sAvailableLanguage)) {
            var aCurrencyLong = oPersistency.Administration.getAdministration(oParameters, sAvailableLanguage, new Date())[BusinessObjectsEntities.CURRENCY_ENTITIES];
            _.each(aCurrencyLong, function (oCurrencyLong) {
                var oCurrencyShort = {};
                oCurrencyShort = _.pick(oCurrencyLong, 'CURRENCY_ID', 'CURRENCY_CODE', 'CURRENCY_DESCRIPTION');
                aCurrency.push(oCurrencyShort);
            });
        }

        return aCurrency;
    }

    /**
	 * Gets the available units of measure.
	 * 
	 * @param {string}
	 *            sIsoLanguage - the user language as language code used PLC (e.g. "en" for english)
	 * @param oPersistency   {object}  - instance of persistency
	 * 
	 * @return {array} aUOM - the array containing all units of measure
	 */
    async function getUnitOfMeasures(sIsoLanguage, oPersistency) {
        var oParameters = {}, aUOM = [];

        oParameters.business_object = BusinessObjectTypes.UnitOfMeasure;
        var sAvailableLanguage = oPersistency.Misc.determineAvailableLanguage(Resources[oParameters.business_object].dbobjects.plcTextTable, sIsoLanguage);

        if (!helpers.isNullOrUndefined(sAvailableLanguage)) {
            var aUOMLong = oPersistency.Administration.getAdministration(oParameters, sAvailableLanguage, new Date())[BusinessObjectsEntities.UOM_ENTITIES];
            _.each(aUOMLong, function (oUOMLong) {
                var oUOMShort = {};
                oUOMShort = _.pick(oUOMLong, 'UOM_ID', 'UOM_CODE', 'UOM_DESCRIPTION');
                aUOM.push(oUOMShort);
            });
        }

        return aUOM;
    }

};
export default {_,Constants,helpers,MetadataProvider,BusinessObjectTypes,BusinessObjectsEntities,Resources,ApplicationDataService,MessageLibrary,PlcException,Code};
