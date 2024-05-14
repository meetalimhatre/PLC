var Resources = $.require('../../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var MessageLibrary = $.require('../../../util/message');
var HelperObjectTypes = $.require('../../../util/constants').HelperObjectTypes;
var Session = $.require('../../../db/persistency-session').Session;
var MessageCode = MessageLibrary.Code;
var Operation = MessageLibrary.Operation;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;

function Language(dbConnection, hQuery, sObjectName) {
    var sDefaultLanguage = 'EN';
    var oSession = null;
    var oSessionDetails = null;

    MasterDataBaseObject.apply(this, arguments);

    Language.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.LANGUAGE_ENTITIES] = Array.slice(result.OT_LANGUAGE);

        return oReturnObject;
    };

    Language.prototype.validateBefore = async function () {

        if (oSession === null) {
            oSession = await new Session($, dbConnection, hQuery);
        }

        if (oSessionDetails === null) {
            oSessionDetails = oSession.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
        }

        var sqlMainNotSupported = 'update temp_table' + " set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'" + ' from "' + Resources[sObjectName].dbobjects.tempTable + '" as temp_table' + "    where temp_table.operation in ('" + Operation.CREATE + "', '" + Operation.UPSERT + "', '" + Operation.DELETE + "')" + "    and (temp_table.error_code = '' or  temp_table.error_code is null)";

        await dbConnection.executeUpdate(sqlMainNotSupported);

        var sqlMain = 'update temp_table' + " set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_UNEXPECTED_EXCEPTION.code + "'" + ' from "' + Resources[sObjectName].dbobjects.tempTable + '" as temp_table' + "    where temp_table.LANGUAGE in ('" + oSessionDetails.language + "','" + sDefaultLanguage + "')" + "    and temp_table.operation in ('" + Operation.UPDATE + "')" + "    and (temp_table.error_code = '' or  temp_table.error_code is null)";

        await dbConnection.executeUpdate(sqlMain);
    };
}

Language.prototype = Object.create(MasterDataBaseObject.prototype);
Language.prototype.constructor = Language;
export default {Resources,BusinessObjectsEntities,MasterDataBaseObject,MessageLibrary,HelperObjectTypes,Session,MessageCode,Operation,ValidationInfoCode,Language};
