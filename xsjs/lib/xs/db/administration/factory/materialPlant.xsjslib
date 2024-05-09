var BusinessObjectsEntities = $.require("../../../util/masterdataResources").BusinessObjectsEntities;
var MasterDataBaseObject 	= $.import("xs.db.administration.factory", "masterDataBaseObject").MasterDataBaseObject;

function MaterialPlant(dbConnection, hQuery, sObjectName) {
	
	MasterDataBaseObject.apply(this, arguments);

	MaterialPlant.prototype.getDataUsingSqlProcedure = function(fnProcedure, oProcedureParameters){
    	var oReturnObject = {}; 	
    	var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, 
								 oProcedureParameters.sSqlFilter,oProcedureParameters.iTopRecords, 
								 oProcedureParameters.iSkipRecords);
    	oReturnObject[BusinessObjectsEntities.MATERIAL_PLANT_ENTITIES] = Array.slice(result.OT_MATERIAL_PLANT);
		oReturnObject[BusinessObjectsEntities.MATERIAL_ENTITIES] = Array.slice(result.OT_MATERIAL);
		oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
		oReturnObject[BusinessObjectsEntities.OVERHEAD_GROUP_ENTITIES] = Array.slice(result.OT_OVERHEAD_GROUP);
		oReturnObject[BusinessObjectsEntities.VALUATION_CLASS_ENTITIES] = Array.slice(result.OT_VALUATION_CLASS);
		oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
		oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);

    	return oReturnObject; 
    };    
}

MaterialPlant.prototype = Object.create(MasterDataBaseObject.prototype);
MaterialPlant.prototype.constructor = MaterialPlant;