const _ = require('lodash');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;


module.exports.Layout = function ($) {

    var sUserId = $.getPlcUsername();
    /**
 * Handles a HTTP GET requests to get all personal and corporate layouts.
 *
 */
    this.get = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        if (helpers.isNullOrUndefined(aParameters.layout_type)) {
            aParameters.layout_type = 1;
        }
        var oLayoutInformation = await oPersistency.Layout.getLayouts(sUserId, aParameters.layout_type);

        // add columns and hidden fields for each layout
        var aLayouts = [];
        _.each(oLayoutInformation.LAYOUT, function (oLayout) {
            var oLayoutInfo = {};
            oLayoutInfo = _.clone(oLayout);
            oLayoutInfo.LAYOUT_COLUMNS = _.filter(oLayoutInformation.LAYOUT_COLUMN, function (oLayoutColumn) {
                return oLayoutColumn.LAYOUT_ID === oLayoutInfo.LAYOUT_ID;
            });
            oLayoutInfo.HIDDEN_FIELDS = _.filter(oLayoutInformation.HIDDEN_FIELDS, function (oLayoutHiddenFields) {
                return oLayoutHiddenFields.LAYOUT_ID === oLayoutInfo.LAYOUT_ID;
            });
            aLayouts.push(oLayoutInfo);
        });

        oServiceOutput.setLayoutData(aLayouts);
        return oServiceOutput;
    };

    /**
 * Handles a HTTP POST request to add a new layout
 *
 */
    this.create = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iIsCorporate = aParameters.is_corporate === true ? 1 : 0;

        //check name is unique for every combination of USER_ID and IS_CORPORATE
        if (!helpers.isNullOrUndefined(oBodyItems.LAYOUT_NAME) && !await oPersistency.Layout.isNameUnique(oBodyItems.LAYOUT_ID, oBodyItems.LAYOUT_NAME, sUserId)) {
            const sLogMessage = `Layout name ${ oBodyItems.LAYOUT_NAME } is not unique for the combination of user_id and is_corporate.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.WRITE_LAYOUT_NAMING_CONFLICT, sLogMessage);
        }

        var iLayoutId = await oPersistency.Layout.create(oBodyItems, sUserId, iIsCorporate);
        oServiceOutput.setStatus(iLayoutId > 0 ? $.net.http.CREATED : $.net.http.OK);
        oServiceOutput.setBody({ LAYOUT_ID: iLayoutId });
        return oServiceOutput;
    };

    /**
 * Handles a HTTP PUT request to modify an existing layout
 *
 */
    this.update = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iIsCorporate = aParameters.is_corporate === true ? 1 : 0;

        //check if layout exists
        if (!oPersistency.Layout.exists(oBodyItems.LAYOUT_ID)) {
            const sLogMessage = `Layout with id ${ oBodyItems.LAYOUT_ID } not found.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        //check name is unique for every combination of USER_ID and IS_CORPORATE
        if (!helpers.isNullOrUndefined(oBodyItems.LAYOUT_NAME) && !await oPersistency.Layout.isNameUnique(oBodyItems.LAYOUT_ID, oBodyItems.LAYOUT_NAME, sUserId)) {
            const sLogMessage = `Layout name ${ oBodyItems.LAYOUT_NAME } is not unique for the combination of user_id and is_corporate.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.WRITE_LAYOUT_NAMING_CONFLICT, sLogMessage);
        }

        var iLayoutId = await oPersistency.Layout.update(oBodyItems, sUserId, iIsCorporate);
        oServiceOutput.setStatus($.net.http.OK);
        oServiceOutput.setBody({ LAYOUT_ID: iLayoutId });
        return oServiceOutput;
    };

    /**
 * Handles a HTTP DELETE request to delete an existing layout
 *
 */
    this.remove = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {
        var iIsCorporate = aParameters.is_corporate === true ? 1 : 0;
        var iDeletedRows = await oPersistency.Layout.deleteLayout(oBodyItems.LAYOUT_ID, sUserId, iIsCorporate);
        if (iDeletedRows === 0) {
            const sLogMessage = `Layout with id ${ oBodyItems.LAYOUT_ID } not found.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        oServiceOutput.setStatus($.net.http.OK);
        return oServiceOutput;
    };

};
export default {_,helpers,MessageLibrary,PlcException,Code};
