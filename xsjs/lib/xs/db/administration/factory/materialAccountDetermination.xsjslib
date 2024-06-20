var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var Resources = $.require('../../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var MessageLibrary = $.require('../../../util/message');
var PlcException = MessageLibrary.PlcException;
var MessageCode = MessageLibrary.Code;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;
var AdministrationObjType = MessageLibrary.AdministrationObjType;
var Operation = MessageLibrary.Operation;

function MaterialAccountDetermination(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    MaterialAccountDetermination.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

        oReturnObject[BusinessObjectsEntities.MATERIAL_ACCOUNT_DETERMINATION_ENTITIES] = Array.slice(result.OT_MATERIAL_ACCOUNT_DETERMINATION);
        oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        oReturnObject[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = Array.slice(result.OT_MATERIAL_TYPE);
        oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
        oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
        oReturnObject[BusinessObjectsEntities.VALUATION_CLASS_ENTITIES] = Array.slice(result.OT_VALUATION_CLASS);
        oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);

        return oReturnObject;
    };

    /* Initialization
	 * Keys: MATERIAL_TYPE_ID, PLANT_ID, VALUATION_CLASS_ID can be empty
	*/
    MaterialAccountDetermination.prototype.initializeColumns = async function (oRecord, sOperation, sObjectType) {
        if (helpers.isNullOrUndefined(oRecord.MATERIAL_TYPE_ID)) {
            oRecord.MATERIAL_TYPE_ID = '';
        }
        if (helpers.isNullOrUndefined(oRecord.PLANT_ID)) {
            oRecord.PLANT_ID = '';
        }
        if (helpers.isNullOrUndefined(oRecord.VALUATION_CLASS_ID)) {
            oRecord.VALUATION_CLASS_ID = '';
        }
    };

    /* Additional checks for mandatory fields
	 * MATERIAL_TYPE_ID, PLANT_ID, VALUATION_CLASS_ID can be empty (even if they are in the key)
	*/
    MaterialAccountDetermination.prototype.checkMandatoryProperties = function (oEntry, sOperation, sObjectType) {
        var aMandatoryProperties = ['CONTROLLING_AREA_ID'];
        if ((sOperation === Operation.UPDATE || sOperation === Operation.DELETE) && Resources[sObjectName].configuration.IsVersioned) {
            aMandatoryProperties = _.union(aMandatoryProperties, ['_VALID_FROM']);
        }
        if ((sOperation === Operation.CREATE || sOperation === Operation.UPDATE || sOperation === Operation.UPSERT) && sObjectType === AdministrationObjType.MAIN_OBJ && !helpers.isNullOrUndefined(Resources[sObjectName].configuration.aOtherMandatoryColumns)) {
            aMandatoryProperties = _.union(aMandatoryProperties, Resources[sObjectName].configuration.aOtherMandatoryColumns);
        }
        MasterDataBaseObject.prototype.checkMandatoryNotNullProperties(oEntry, aMandatoryProperties);
    };

}

MaterialAccountDetermination.prototype = Object.create(MasterDataBaseObject.prototype);
MaterialAccountDetermination.prototype.constructor = MaterialAccountDetermination;
export default {_,helpers,Resources,BusinessObjectsEntities,MasterDataBaseObject,MessageLibrary,PlcException,MessageCode,ValidationInfoCode,AdministrationObjType,Operation,MaterialAccountDetermination};
