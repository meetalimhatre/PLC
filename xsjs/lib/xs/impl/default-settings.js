const _ = require('lodash');
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

module.exports.DefaultSettings = function ($) {

    async function throwLockingUserException(sLockUser) {
        var oMessageDetails = new MessageDetails();
        oMessageDetails.addUserObj({ id: sLockUser });

        const sClientMsg = 'Table is locked by another user. Default Settings cannot be created/updated/removed.';
        const sServerMsg = `${ sClientMsg } Locking user id: ${ sLockUser }.`;
        $.trace.error(sServerMsg);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
    }


    this.get = async function (aBodyMeta, oParameters, oServiceOutput, oPersistency) {
        var oDefaultSettings = {};
        var oLockStatus = {};
        var sType = oParameters.type;
        var vLock = oParameters.lock;
        var sUserId = $.getPlcUsername();
        var sSessionId = $.getPlcUsername();
        var mSessionDetails = await oPersistency.Session.getSessionDetails(sSessionId, sUserId);

        if (sType === 'global') {
            // release all locked objects for current user.
            oPersistency.Misc.releaseLock(sUserId);
            // lock table t_lock LOCK TABLE A IN EXCLUSIVE MODE if lock parameter from URL is set to true
            if (vLock === true || vLock === 'true') {
                var aLockObject = oPersistency.Misc.getLock(BusinessObjectTypes.DefaultSettings, sUserId);
                if (aLockObject.length > 0) {
                    oLockStatus.USER_ID = aLockObject[0].USER_ID;
                    oLockStatus.IS_LOCKED = 1;
                } else {
                    oPersistency.Misc.setLock(BusinessObjectTypes.DefaultSettings, sUserId);
                    oLockStatus.IS_LOCKED = 0;
                }
            }

            // if type is global, then user should be empty
            sUserId = '';
        }

        oDefaultSettings = await oPersistency.DefaultSettings.get(sType, sUserId, mSessionDetails.language, new Date());

        var oResponse = {};
        oResponse.DEFAULT_SETTINGS = oDefaultSettings;
        if (_.isEmpty(oLockStatus) === false) {
            oResponse.DEFAULT_SETTINGS.LOCK_STATUS = oLockStatus;
        }

        oServiceOutput.setBody(oResponse);

    };

    this.create = async function (oDefaultSettings, oParameters, oServiceOutput, oPersistency) {
        var oResult = {};
        var sType = oParameters.type;
        var sUserId = $.getPlcUsername();

        if (sType === 'global') {
            // create is possible only if the default_settings are not locked by another user
            var aLockObject = await oPersistency.Misc.getLock(BusinessObjectTypes.DefaultSettings, sUserId);

            if (aLockObject.length === 0) {
                oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.create(oDefaultSettings, sType, sUserId);
                oServiceOutput.setBody(oResult).setStatus($.net.http.CREATED);
            } else {
                await throwLockingUserException(aLockObject[0].USER_ID);
            }
        } else {
            oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.create(oDefaultSettings, sType, sUserId);
            oServiceOutput.setBody(oResult).setStatus($.net.http.CREATED);
        }
    };

    this.update = async function (oDefaultSettings, oParameters, oServiceOutput, oPersistency) {
        var oResult = {};
        var sType = oParameters.type;
        var sUserId = $.getPlcUsername();

        if (sType === 'global') {

            // update is possible only if the default_settings are not locked by another user
            var aLockObject = oPersistency.Misc.getLock(BusinessObjectTypes.DefaultSettings, sUserId);

            if (aLockObject.length === 0) {
                oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.update(oDefaultSettings, sType, sUserId);
                oServiceOutput.setBody(oResult);
            } else {
                await throwLockingUserException(aLockObject[0].USER_ID);
            }
        } else {
            oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.update(oDefaultSettings, sType, sUserId);
            oServiceOutput.setBody(oResult);
        }
    };


    this.remove = async function (oDefaultSettings, oParameters, oServiceOutput, oPersistency) {
        var oResult = {};
        var sType = oParameters.type;
        var sUserId = $.getPlcUsername();

        if (sType === 'global') {

            // remove is possible only if the default_settings are not locked by another user
            var aLockObject = oPersistency.Misc.getLock(BusinessObjectTypes.DefaultSettings, sUserId);

            if (aLockObject.length === 0) {
                oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.removeDefaultSettings(sType, sUserId);
                oServiceOutput.setBody(oResult);
            } else {
                await throwLockingUserException(aLockObject[0].USER_ID);
            }
        } else {
            oResult.DEFAULT_SETTINGS = await oPersistency.DefaultSettings.removeDefaultSettings(sType, sUserId);
            oServiceOutput.setBody(oResult);
        }
    };

};
export default {_,BusinessObjectTypes,MessageLibrary,PlcException,Code,MessageDetails};
