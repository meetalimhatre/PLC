var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;

function OverheadGroup(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    OverheadGroup.prototype.getDataUsingSqlProcedure = function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var sSqlFilter = oProcedureParameters.sSqlFilter;

        var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sAutocompleteText, sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

        oReturnObject[BusinessObjectsEntities.OVERHEAD_GROUP_ENTITIES] = Array.slice(result.OT_OVERHEAD_GROUP);
        oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
        oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
        oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        if (oProcedureParameters.sAutocompleteText == '')
            oReturnObject[BusinessObjectsEntities.OVERHEAD_GROUP_TEXT_ENTITIES] = Array.slice(result.OT_OVERHEAD_GROUP_TEXT);

        return oReturnObject;
    };
}

OverheadGroup.prototype = await Object.create(MasterDataBaseObject.prototype);
OverheadGroup.prototype.constructor = OverheadGroup;
export default {BusinessObjectsEntities,MasterDataBaseObject,OverheadGroup};
