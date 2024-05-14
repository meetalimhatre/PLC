var BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function ConfidenceLevel(dbConnection, hQuery, oConfiguration) {

    MasterDataBaseObject.apply(this, arguments);

    ConfidenceLevel.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sAutocompleteText, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.CONFIDENCE_LEVEL_ENTITIES] = Array.slice(result.OT_CONFIDENCE_LEVEL);
        oReturnObject[BusinessObjectsEntities.CONFIDENCE_LEVEL_TEXT_ENTITIES] = Array.slice(result.OT_CONFIDENCE_LEVEL_TEXT);

        return oReturnObject;
    };
}

ConfidenceLevel.prototype = Object.create(MasterDataBaseObject.prototype);
ConfidenceLevel.prototype.constructor = ConfidenceLevel;
export default {BusinessObjectTypes,BusinessObjectsEntities,MasterDataBaseObject,ConfidenceLevel};
