var _ 						= $.require("lodash");
var helpers 				= $.require("../../util/helpers");
var BusinessObjectTypes 	= $.require("../../util/constants").BusinessObjectTypes;
var BusinessObjectsEntities = $.require("../../util/masterdataResources").BusinessObjectsEntities;
var apiHelpers 				= $.import("xs.db.administration", "api-helper");
var MasterdataBaseImport 	= $.import("xs.db.administration", "api-base");

const MessageLibrary 		= $.require("../../util/message");
const MessageOperation 		= MessageLibrary.Operation;
const PlcException 			= MessageLibrary.PlcException;
const Code 			        = MessageLibrary.Code;
const AdministrationObjType = MessageLibrary.AdministrationObjType;
const ValidationInfoCode 	= MessageLibrary.ValidationInfoCode;
const Severity       		= MessageLibrary.Severity;

var Procedures = Object.freeze({
	exchange_rate_type_read : 'sap.plc.db.administration.procedures::p_exchange_rate_type_read'
});

var oConfiguration = {
		sObjectName                 : BusinessObjectTypes.ExchangeRateType,
		aCompleteKeyPlcTableColumns : ["EXCHANGE_RATE_TYPE_ID"],
		aPartialKeyPlcTableColumns  : ["EXCHANGE_RATE_TYPE_ID"],
		aMandatoryMainColumns       : ["EXCHANGE_RATE_TYPE_ID"],
		aTextColumns                : ["EXCHANGE_RATE_TYPE_DESCRIPTION"],
		MainEntitiesSection         : BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES,
		TextEntitiesSection         : BusinessObjectsEntities.EXCHANGE_RATE_TYPE_TEXT_ENTITIES,
		bIsVersioned                : false,
		UsedInBusinessObjects      : [{
							        	 "BusinessObjectName" : BusinessObjectTypes.CurrencyConversion,
							        	 "FieldsName": [ ["EXCHANGE_RATE_TYPE_ID"] ]
									 },{
										 "BusinessObjectName": "Project",
										 "TableName": "sap.plc.db::basis.t_project",
										 "FieldsName": [ ["EXCHANGE_RATE_TYPE_ID"] ],
										 "IsVersioned": false
									 },{
										 "BusinessObjectName": "Calculation_Version",
										 "TableName": "sap.plc.db::basis.t_calculation_version",
										 "FieldsName": [ ["EXCHANGE_RATE_TYPE_ID"] ],
										 "IsVersioned": false
									 },{ 
										 "BusinessObjectName": "Calculation_Version",
										 "TableName": "sap.plc.db::basis.t_calculation_version_temporary",
										 "FieldsName": [ ["EXCHANGE_RATE_TYPE_ID"] ],
										 "IsVersioned": false
									 },{ 
										 "BusinessObjectName": "Variant",
										 "TableName": "sap.plc.db::basis.t_variant",
										 "FieldsName": [ ["EXCHANGE_RATE_TYPE_ID"] ],
										 "IsVersioned": false
									 }]
};

function ExchangeRateType(dbConnection, hQuery, hQueryRepl, oConfiguration) {
    MasterdataBaseImport.MasterdataBase.apply(this, arguments);
   
    ExchangeRateType.prototype.getDataUsingSqlProcedure = function(oGetParameters, sLanguage, sMasterDataDate, sTextFromAutocomplete, iNoRecords, sSQLstring){
    	var oReturnObject = {}; 	
    	var iSkipRecords = 0;
    	
    	if(!helpers.isNullOrUndefined(oGetParameters.skip)){
			iSkipRecords = parseInt(oGetParameters.skip);
		}
    	if(sTextFromAutocomplete === ''){
        	try {
        		var procedure = dbConnection.loadProcedure(Procedures.exchange_rate_type_read);
        		var result = procedure(sLanguage, sMasterDataDate, sSQLstring, iNoRecords, iSkipRecords);
        		oReturnObject[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES] = Array.slice(result.OT_EXCHANGE_RATE_TYPE);
        		oReturnObject[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_TEXT_ENTITIES] = Array.slice(result.OT_EXCHANGE_RATE_TYPE_TEXT);
    
        	} catch (e) {
        	    const sLogMessage = `Error duing reading exchange rate type data. when procedure ${Procedures.exchange_rate_type_read} is called.`;
        		$.trace.error(sLogMessage);
        		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        	}
    	} else {
    	     const oFilters = [
        	    ["EXCHANGE_RATE_TYPE_ID", "plcTable.EXCHANGE_RATE_TYPE_ID"],
        	    ["EXCHANGE_RATE_TYPE_DESCRIPTION", "plcTextTable.EXCHANGE_RATE_TYPE_DESCRIPTION"]
        	];
        	let masterdataTimestamp = sMasterDataDate.toJSON();
        	
            let sStmt = ` select  
       				plcTable.EXCHANGE_RATE_TYPE_ID,
        			plcTextTable.EXCHANGE_RATE_TYPE_DESCRIPTION
        		from "sap.plc.db::basis.t_exchange_rate_type" as plcTable 	
                left outer join "sap.plc.db::basis.t_exchange_rate_type__text" as plcTextTable 
                    on  plcTable.EXCHANGE_RATE_TYPE_ID = plcTextTable.EXCHANGE_RATE_TYPE_ID 
                    and plcTextTable.LANGUAGE = '${sLanguage}' 
                where (LOWER(plcTable.EXCHANGE_RATE_TYPE_ID) LIKE LOWER('${sTextFromAutocomplete}%')
    				or LOWER(plcTextTable.EXCHANGE_RATE_TYPE_DESCRIPTION) LIKE LOWER('${sTextFromAutocomplete}%') ) `;
    		
    		if(sSQLstring !== '') {
    		    let filter = sSQLstring;
    		    for(let i=0; i < oFilters.length; i++) {
		            filter = filter.replace(oFilters[i][0], oFilters[i][1]);
	            
	            }
    		    sStmt += ` and ${filter}`;
    		}
    		sStmt += ` order by EXCHANGE_RATE_TYPE_ID`;
    		sStmt += ` limit ${iNoRecords} offset ${iSkipRecords}`;
	        oReturnObject[BusinessObjectsEntities.EXCHANGE_RATE_TYPE_ENTITIES] = _.values(dbConnection.executeQuery(sStmt));
    	}
    	return oReturnObject; 
    };
    
    ExchangeRateType.prototype.checkMainRowRemove = function(oObject, sMasterDataDate){
        MasterdataBaseImport.MasterdataBase.prototype.checkMainRowRemove.call(this, oObject, sMasterDataDate);  // call parent method
    	apiHelpers.checkNotVersionedMainRowToRemove(oObject,sMasterDataDate,oConfiguration,hQuery); //check if the row can be deleted	
    };
    
   	ExchangeRateType.prototype.checkTextRowRemove = function(oObjectText, sMasterDataDate){
   	   MasterdataBaseImport.MasterdataBase.prototype.checkTextRowRemove.call(this, oObjectText, sMasterDataDate);  // call parent method
		apiHelpers.checkNotVersionedTextRowToRemove(oObjectText,sMasterDataDate,oConfiguration,hQuery);
	};
    
    ExchangeRateType.prototype.removeMainRow = function(oObject,sMasterDataDate){
	    apiHelpers.removeNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery);
	};
	
	ExchangeRateType.prototype.removeTextRow = function(oObjectText,sMasterDataDate){
    	apiHelpers.removeNotVersionedTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery);
	};
		    
    ExchangeRateType.prototype.checkMainRowInsert = function(oObject, sMasterDataDate){
        MasterdataBaseImport.MasterdataBase.prototype.checkMainRowInsert.call(this, oObject, sMasterDataDate);  // call parent method
    	apiHelpers.checkNotVersionedMainRowToInsert(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl);//check if the row can be inserted
    };
    
    ExchangeRateType.prototype.checkTextRowInsert = function(oObjectText, sMasterDataDate){
    	MasterdataBaseImport.MasterdataBase.prototype.checkTextRowInsert.call(this, oObjectText, sMasterDataDate);  // call parent method
    	apiHelpers.checkNotVersionedTextRowToInsert(oObjectText, sMasterDataDate, oConfiguration, hQuery, hQueryRepl);//check if the row can be inserted
	};

    ExchangeRateType.prototype.insertTextRow = function(oObjectText,sMasterDataDate){
    	var oResult = apiHelpers.insertNotVersionedTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,this.helper);
		return oResult;
	};
    
    ExchangeRateType.prototype.insertMainRow = function(oObject,sMasterDataDate){
		var oResult = apiHelpers.insertNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,this.helper);
		return oResult;
	};
	
	ExchangeRateType.prototype.checkMainRowUpdate = function(oObject, sMasterDataDate){
        MasterdataBaseImport.MasterdataBase.prototype.checkMainRowUpdate.call(this, oObject, sMasterDataDate); // call parent method
    	apiHelpers.checkNotVersionedMainRowToUpdate(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl);//check if the row can be updated
	};
	
	ExchangeRateType.prototype.checkTextRowUpdate = function(oObjectText, sMasterDataDate){
    	MasterdataBaseImport.MasterdataBase.prototype.checkTextRowUpdate.call(this, oObjectText, sMasterDataDate); // call parent method
    	apiHelpers.checkNotVersionedTextRowToUpdate(oObjectText, sMasterDataDate, oConfiguration, hQuery, hQueryRepl);//check if the row can be updated
	};
	
	ExchangeRateType.prototype.updateMainRow = function(oObject,sMasterDataDate){
		var oResult = apiHelpers.updateNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,this.helper);
		return oResult;
	};

	ExchangeRateType.prototype.updateTextRow = function(oObjectText,sMasterDataDate){
		var oResult = apiHelpers.updateNotVersionedTextRow(oObjectText,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,this.helper);
		return oResult;
	};
}

ExchangeRateType.prototype = Object.create(MasterdataBaseImport.MasterdataBase.prototype);
ExchangeRateType.prototype.constructor = ExchangeRateType;
