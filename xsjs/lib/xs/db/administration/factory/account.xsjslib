var _ 						= $.require("lodash");
var BusinessObjectTypes 	= $.require("../../../util/constants").BusinessObjectTypes;
var Resources 				= $.require("../../../util/masterdataResources").MasterdataResource;
var BusinessObjectsEntities = $.require("../../../util/masterdataResources").BusinessObjectsEntities;
var MasterDataBaseObject 	= $.import("xs.db.administration.factory", "masterDataBaseObject").MasterDataBaseObject;
var MessageLibrary   		= $.require("../../../util/message");
var MessageCode      		= MessageLibrary.Code;
var ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
var Operation 	            = MessageLibrary.Operation;

function Account(dbConnection, hQuery, sObjectName) {
	
	MasterDataBaseObject.apply(this, arguments);

	Account.prototype.getDataUsingSqlProcedure = function(fnProcedure, oProcedureParameters){
    	var oReturnObject = {}; 
    	
    	var oFilters = [
    	    ["ACCOUNT_ID", "plcTable.ACCOUNT_ID"],
    	    ["CONTROLLING_AREA_ID", "plcTable.CONTROLLING_AREA_ID"],
    	    ["ACCOUNT_DESCRIPTION", "plcTextTable.ACCOUNT_DESCRIPTION"],
    	    ["_SOURCE", "plcTable._SOURCE"]
    	];
    	
    	if(oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter,
        				           oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        	oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);
    		oReturnObject[BusinessObjectsEntities.ACCOUNT_TEXT_ENTITIES] = Array.slice(result.OT_ACCOUNTS_TEXT);
    		oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
    	} else {
    	    let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();

    	    let stmt = `select  
        			    plcTable.ACCOUNT_ID,
        			    plcTable.CONTROLLING_AREA_ID,
        			    plcTable._SOURCE,
        			    plcTextTable.ACCOUNT_DESCRIPTION 
        			from "sap.plc.db::basis.t_account" as plcTable
        			left outer join "sap.plc.db::basis.t_account__text" as plcTextTable 
        			    on  plcTable.ACCOUNT_ID = plcTextTable.ACCOUNT_ID 
        			    and plcTable.CONTROLLING_AREA_ID = plcTextTable.CONTROLLING_AREA_ID 
        			    and plcTextTable.LANGUAGE = '${oProcedureParameters.sLanguage}'
        			    and plcTextTable._VALID_FROM <= '${masterdataTimestamp}' 
        			    and (plcTextTable._VALID_TO > '${masterdataTimestamp}' or plcTextTable._VALID_TO is null)  
        			where plcTable._VALID_FROM <= '${masterdataTimestamp}'
        			    and (plcTable._VALID_TO > '${masterdataTimestamp}' or plcTable._VALID_TO is null) 
        			    and ( LOWER(plcTable.ACCOUNT_ID) LIKE LOWER('${oProcedureParameters.sAutocompleteText}%')
        			    or LOWER(plcTextTable.ACCOUNT_DESCRIPTION) LIKE LOWER('${oProcedureParameters.sAutocompleteText}%') )`; 
		    
		    if(oProcedureParameters.sSqlFilter !== '') {
    		    let filter = oProcedureParameters.sSqlFilter;
    		    for(let i=0; i < oFilters.length; i++) {
		            filter = filter.replace(oFilters[i][0], oFilters[i][1]);
	            
	            }
    		    stmt += ` and ${filter}`;
    		}
    		
    	  stmt += ` order by ACCOUNT_ID, CONTROLLING_AREA_ID`;
          stmt += ` limit ${oProcedureParameters.iTopRecords} offset ${ oProcedureParameters.iSkipRecords}`;
          oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = _.values(dbConnection.executeQuery(stmt));
    	}
    	
    	return oReturnObject; 
    };

    Account.prototype.validateAfter = function(){
    	
    	var sqlMain = "update temp_table" + 
    	" set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'," + 
    	" temp_table.ERROR_DETAILS = '{\"validationObj\": { \"dependencyObjects\": [{\"businessObj\":\"" + 
    	BusinessObjectTypes.CostingSheet + "\"}],\"validationInfoCode\": \"" + ValidationInfoCode.DEPENDENCY_ERROR + "\"}}'" +  
    	" from \"" + Resources[sObjectName].dbobjects.tempTable + "\" as temp_table," + 
    	" ( select temporary_table.ACCOUNT_ID, temporary_table.CONTROLLING_AREA_ID, temporary_table._VALID_FROM " + 
    	"    from \"" + Resources[sObjectName].dbobjects.tempTable + "\" as temporary_table" + 
    	"    inner join " + 
    	"      ( select a.CREDIT_ACCOUNT_ID as ACCOUNT_ID, c.CONTROLLING_AREA_ID " + 
        "           from \"sap.plc.db::basis.t_costing_sheet_overhead\" as a " + 
        "           inner join \"sap.plc.db::basis.t_costing_sheet_row\" as b " + 
    	"              on a.COSTING_SHEET_OVERHEAD_ID = b.COSTING_SHEET_OVERHEAD_ID " +
    	"           inner join \"" + Resources[BusinessObjectTypes.CostingSheet].dbobjects.plcTable + "\" as c " +
    	"              on b.COSTING_SHEET_ID = c.COSTING_SHEET_ID  " +
    	"           where a._VALID_FROM <= ? and ( a._VALID_TO > ? or a._VALID_TO is null ) " +
    	"           and b._VALID_FROM <= ? and ( b._VALID_TO > ? or b._VALID_TO is null ) " +
    	"           ) as costing_sheet" + 
    	"     on temporary_table.ACCOUNT_ID = costing_sheet.ACCOUNT_ID and temporary_table.CONTROLLING_AREA_ID = costing_sheet.CONTROLLING_AREA_ID" +
        "    where temporary_table.ACCOUNT_ID is not null and temporary_table.ACCOUNT_ID not in ('','*') " +
        "    and temporary_table.CONTROLLING_AREA_ID is not null and temporary_table.CONTROLLING_AREA_ID not in ('','*') " + 
        "    and temporary_table.operation in ('" + Operation.DELETE + "')" + 
        "    and (temporary_table.error_code = '' or  temporary_table.error_code is null)" + 
    	" ) as result" + 
    	" where  temp_table.ACCOUNT_ID = result.ACCOUNT_ID and  " + 
    	" temp_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID and  " + 
    	" temp_table._VALID_FROM = result._VALID_FROM" + 
    	" and temp_table.operation in ('" + Operation.DELETE + "')" + 
    	" and (temp_table.error_code = '' or  temp_table.error_code is null)";
    
    	dbConnection.executeUpdate(sqlMain, this.context.MasterdataBusinessObject.currentTimestamp, this.context.MasterdataBusinessObject.currentTimestamp, 
    			this.context.MasterdataBusinessObject.currentTimestamp, this.context.MasterdataBusinessObject.currentTimestamp);
    
    	var sql = "update temp_table" + 
		" set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'," + 
		" temp_table.ERROR_DETAILS = '{\"validationObj\": { \"dependencyObjects\": [{\"businessObj\":\"" + 
		BusinessObjectTypes.AccountGroup + "\"}],\"validationInfoCode\": \"" + ValidationInfoCode.DEPENDENCY_ERROR + "\"}}'" +  
		" from \"" + Resources[sObjectName].dbobjects.tempTable + "\" as temp_table," + 
		" ( select temporary_table.ACCOUNT_ID, temporary_table.CONTROLLING_AREA_ID, temporary_table._VALID_FROM " + 
		"    from \"" + Resources[sObjectName].dbobjects.tempTable + "\" as temporary_table" + 
		"      inner join " + 
		"          ( select a.FROM_ACCOUNT_ID, a.TO_ACCOUNT_ID, b.CONTROLLING_AREA_ID  "+ 
	    "             from \"" + Resources[BusinessObjectTypes.AccountAccountGroup].dbobjects.plcTable + "\" as a " + 
	    "             inner join \"" +  Resources[BusinessObjectTypes.AccountGroup].dbobjects.plcTable + "\" as b " + 
		"             on a.ACCOUNT_GROUP_ID = b.ACCOUNT_GROUP_ID " +
		"             where a._VALID_FROM <= ? and ( a._VALID_TO > ? or a._VALID_TO is null ) " +
		"             and b._VALID_FROM <= ? and ( b._VALID_TO > ? or b._VALID_TO is null ) " +
		"           ) as account_group" +
		"      on ( temporary_table.ACCOUNT_ID = account_group.FROM_ACCOUNT_ID or temporary_table.ACCOUNT_ID = account_group.TO_ACCOUNT_ID ) and temporary_table.CONTROLLING_AREA_ID = account_group.CONTROLLING_AREA_ID" +
		"    where temporary_table.ACCOUNT_ID is not null and temporary_table.ACCOUNT_ID not in ('','*') " +
	    "    and temporary_table.CONTROLLING_AREA_ID is not null and temporary_table.CONTROLLING_AREA_ID not in ('','*') " + 
	    "    and temporary_table.operation in ('" + Operation.DELETE + "')" + 
	    "    and (temporary_table.error_code = '' or  temporary_table.error_code is null)" + 
		"  ) as result" + 
		" where  temp_table.ACCOUNT_ID = result.ACCOUNT_ID   " + 
		" and temp_table.CONTROLLING_AREA_ID = result.CONTROLLING_AREA_ID  " + 
		" and temp_table._VALID_FROM = result._VALID_FROM" + 
		" and temp_table.operation in ('" + Operation.DELETE + "')" + 
		" and (temp_table.error_code = '' or  temp_table.error_code is null)";
					
    	dbConnection.executeUpdate(sql, this.context.MasterdataBusinessObject.currentTimestamp, this.context.MasterdataBusinessObject.currentTimestamp, 
			this.context.MasterdataBusinessObject.currentTimestamp, this.context.MasterdataBusinessObject.currentTimestamp);	
    };
}


Account.prototype = Object.create(MasterDataBaseObject.prototype);
Account.prototype.constructor = Account;