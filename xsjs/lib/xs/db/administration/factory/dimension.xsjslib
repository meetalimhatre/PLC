var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function Dimension(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Dimension.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sAutocompleteText, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.DIMENSION_ENTITIES] = Array.slice(result.OT_DIMENSION);
        oReturnObject[BusinessObjectsEntities.DIMENSION_TEXT_ENTITIES] = Array.slice(result.OT_DIMENSION_TEXT);

        return oReturnObject;
    };
}

Dimension.prototype = Object.create(MasterDataBaseObject.prototype);
Dimension.prototype.constructor = Dimension;
export default {BusinessObjectsEntities,MasterDataBaseObject,Dimension};
