var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function ValuationClass(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    ValuationClass.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sAutocompleteText, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.VALUATION_CLASS_ENTITIES] = Array.slice(result.OT_VALUATION_CLASS);
        if (oProcedureParameters.sAutocompleteText == '')
            oReturnObject[BusinessObjectsEntities.VALUATION_CLASS_TEXT_ENTITIES] = Array.slice(result.OT_VALUATION_CLASS_TEXT);

        return oReturnObject;
    };
}

ValuationClass.prototype = Object.create(MasterDataBaseObject.prototype);
ValuationClass.prototype.constructor = ValuationClass;
export default {BusinessObjectsEntities,MasterDataBaseObject,ValuationClass};
