var _ 						= $.require("lodash");
var helpers 				= $.require("../../../util/helpers");
var Resources 				= $.require("../../../util/masterdataResources").MasterdataResource;
var BusinessObjectsEntities = $.require("../../../util/masterdataResources").BusinessObjectsEntities;
var MasterDataBaseObject 	= $.import("xs.db.administration.factory", "masterDataBaseObject").MasterDataBaseObject;
var HelperObjectTypes 	    = $.require("../../../util/constants").HelperObjectTypes;
var MessageLibrary   		= $.require("../../../util/message");
var PlcException     		= MessageLibrary.PlcException;
var MessageCode      		= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var AdministrationObjType   = MessageLibrary.AdministrationObjType;
var Operation 	            = MessageLibrary.Operation;

function Currency(dbConnection, hQuery, sObjectName) {
	
	MasterDataBaseObject.apply(this, arguments);

	Currency.prototype.getDataUsingSqlProcedure = function(fnProcedure, oProcedureParameters){
    	var oReturnObject = {}; 	
    	var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, 
    							 oProcedureParameters.sSqlFilter,oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
    	oReturnObject[BusinessObjectsEntities.CURRENCY_ENTITIES] = Array.slice(result.OT_CURRENCIES);
		oReturnObject[BusinessObjectsEntities.CURRENCY_TEXT_ENTITIES] = Array.slice(result.OT_CURRENCY_TEXTS);
		
    	return oReturnObject; 
    };
	
	/**
	 * Check if mandatory fields are filled. 
	 */
	Currency.prototype.checkMandatoryProperties = function(oEntry, sOperation, sObjectType){
		
		var aMandatoryProperties = Resources[sObjectName].configuration.aKeyColumns;
		if(( sOperation === Operation.UPDATE || sOperation === Operation.DELETE) && (Resources[sObjectName].configuration.IsVersioned)){
			aMandatoryProperties = _.union(aMandatoryProperties,["_VALID_FROM"]);
		}
		if(( sOperation === Operation.CREATE || sOperation === Operation.UPDATE) && (sObjectType === AdministrationObjType.MAIN_OBJ) 
				&& (!helpers.isNullOrUndefined(Resources[sObjectName].configuration.aOtherMandatoryColumns))){
			aMandatoryProperties = _.union(aMandatoryProperties,Resources[sObjectName].configuration.aOtherMandatoryColumns);
		}
	    if(sObjectType === AdministrationObjType.TEXT_OBJ){
			aMandatoryProperties = _.union(aMandatoryProperties,["LANGUAGE"]);
		}
	    
		MasterDataBaseObject.prototype.checkMandatoryNotNullProperties(oEntry, aMandatoryProperties);
	};
	
	/* Checks if the currency is standard. In this case it cannot be deleted
	*/
	Currency.prototype.validateBefore = function(){
		
		var sqlMain = "update temp_table" + 
					" set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'," + 
					" temp_table.ERROR_DETAILS = '{\"validationObj\": { \"dependencyObjects\": [{\"businessObj\":\"" + 
					HelperObjectTypes.Standard + "\"}],\"validationInfoCode\": \"" + ValidationInfoCode.DEPENDENCY_ERROR + "\"}}'" + 
					" from \"" + Resources[sObjectName].dbobjects.tempTable + "\" as temp_table" + 
				    "    where temp_table.CURRENCY_ID in ('EUR')" + 
				    "    and temp_table.operation in ('" + Operation.DELETE + "')" + 
				    "    and (temp_table.error_code = '' or  temp_table.error_code is null)";
		
		dbConnection.executeUpdate(sqlMain);
		
		var sqlText = "update temp_table" + 
		" set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'," + 
		" temp_table.ERROR_DETAILS = '{\"validationObj\": { \"dependencyObjects\": [{\"businessObj\":\"" + 
		HelperObjectTypes.Standard + "\"}],\"validationInfoCode\": \"" + ValidationInfoCode.DEPENDENCY_ERROR + "\"}}'" + 
		" from \"" + Resources[sObjectName].dbobjects.tempTextTable + "\" as temp_table" + 
	    "    where temp_table.CURRENCY_ID in ('EUR')" + 
	    "    and temp_table.operation in ('" + Operation.DELETE + "')" + 
	    "    and (temp_table.error_code = '' or  temp_table.error_code is null)";

		dbConnection.executeUpdate(sqlText);
	};    
}

Currency.prototype = Object.create(MasterDataBaseObject.prototype);
Currency.prototype.constructor = Currency;