const _              					= $.require("lodash");
const helpers        					= $.require("../../util/helpers");
const aSource        					= $.require("../../util/masterdataResources").Source;
const Resources      					= $.require("../../util/masterdataResources").MasterdataResource;
const BusinessObjectTypes     		    = $.require("../../util/constants").BusinessObjectTypes;
const BusinessObjectValidatorUtils 	    = $.require("../../validator/businessObjectValidatorUtils").BusinessObjectValidatorUtils;

const MessageLibrary 			= $.require("../../../xs/util/message");
const MessageDetails 			= MessageLibrary.Details;
const PlcException   			= MessageLibrary.PlcException;
const Severity       			= MessageLibrary.Severity;
const Code    			        = MessageLibrary.Code;
const ValidationInfoCode 		= MessageLibrary.ValidationInfoCode;
const AdministrationObjType     = MessageLibrary.AdministrationObjType;
const MessageOperation 		    = MessageLibrary.Operation;

/**
 * Helper to check if table name is not empty.
 */
function checkTableNameNonEmpty(sTableName){
    if (sTableName === "") {
        const sLogMessage = `Table name is not specified.`;
        const oMessageDetails = new MessageDetails();
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }
}

/**
 * Helper to check if the column and value arrays have the same length.
 */
function checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns){
    if(aKeyPlcTableColumns.length !== aKeyPlcValuesColumns.length){
        const sLogMessage = `Different lenghts for columns and values arrays.`;
        const oMessageDetails = new MessageDetails();
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }
}


/**
 * Create a filter object from a filter string
 * 
 * @param   {string} sFilter - filter string(e.g:(CONTROLLING_AREA=123 and COMPANY_CODE_ID=2345)) retrieved from url parameter filter(e.g: filter=CONTROLLING_AREA=123 and COMPANY_CODE_ID=2345)
 * @returns {object} oFilter - filter object (e.g.: {"CONTROLLING_AREA":"123","COMPANY_CODE_ID":"2345"})
 */
function getFilterObjectFromFilterString(sFilter,aMetadata){
	var oFilter = {};
	var oColumns = [];
	var oValues = [];
	
	var oValidationUtils = new BusinessObjectValidatorUtils(); 
	
	if(helpers.isNullOrUndefined(sFilter)){
		return oFilter;
	}
	
	helpers.checkStringSQLInjection(sFilter);
	
	//get "filter" values -->e.g: filter=CONTROLLING_AREA=123&COMPANY_CODE_ID=2345
	var aOperations = sFilter.split("&");
	_.each(aOperations, function(sOperation,iIndex) {
		if(sOperation.indexOf('CONTROLLING_AREA_ID') !== -1 ){
			var aOperands = sOperation.split('=');
			oValidationUtils.checkColumn(aMetadata,aOperands[0],aOperands[1]); 
			oColumns.push(aOperands[0]);
			oValues.push(aOperands[1]);
		}	
    });
	
	oFilter = _.zipObject(oColumns,oValues);
	return oFilter;
}

/**
 * Create a response with error
 * 
 * @param   {object} oRecord    - object containing the entity with errors
 * @param   {object} e          - error
 * @param   {object} operation  - operation (UPDATE/CREATE/DELETE)
 * @returns {array}  aResultSet - array of objects with errors
 */
function createResponse(oRecord,section, e, operation, oResultObject) {
	var oResult = {} ;
	var aEntity = [];
	var entitySection = {};
	const oMessageDetails = new MessageDetails(); 
	
	oResult.code = e.code.code;
	oResult.type = e.type;
	oResult.severity = Severity.ERROR;
	oResult.operation = operation;

	if (!helpers.isNullOrUndefined(e.details)){
		aEntity.push(oRecord);
		if(!helpers.isNullOrUndefined(e.details.administrationObjType)) 
			oMessageDetails.administrationObjType = e.details.administrationObjType;
		if(!helpers.isNullOrUndefined(e.details.validationObj)) 
			oMessageDetails.validationObj = e.details.validationObj;
		if(!helpers.isNullOrUndefined(e.details.businessObj)) 
			oMessageDetails.businessObj = e.details.businessObj;
		if(!helpers.isNullOrUndefined(e.details.administrationConflictDetailsObj)) 
			oMessageDetails.administrationConflictDetailsObj = e.details.administrationConflictDetailsObj;
	}else{
		aEntity.push(oRecord);
	}
	
	entitySection[section] = aEntity;
	oMessageDetails.administrationObj = entitySection;
	oResult.details = oMessageDetails;
	oResultObject.errors.push(oResult);
}

/**
 * Determine the values which corresponds to the columns
 * 
 * @param   {array}  aKeyPlcTableColumns - array of columns
 * @param   {object} oObject             - the object
 * @returns {array}  aColumnKeyValues    - array of column values
 */
function getColumnKeyValues(aKeyPlcTableColumns, oObject) {

    var aColumnKeyValues = [];

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
        aColumnKeyValues.push(oObject[sColumnName]);
    });

    return aColumnKeyValues;

}


/**
 * Check columns using metadata object
 *
 * @param oEntry    {object}  - entry that is checked
 * @param aMetadata {object}  - metadata object
 */
function checkColumns(oEntry,aMetadata){
	var oValidationUtils = new BusinessObjectValidatorUtils(); 
	
	if (!_.isObject(oEntry)) {
	    const oMessageDetails = new MessageDetails();
	    oMessageDetails.validationObj = {"validationInfoCode": ValidationInfoCode.SYNTACTIC_ERROR};

		const sClientMsg = "Error in checkColumns: oEntry must be a valid object";
		const sServerMsg = `${sClientMsg} oEntry: ${JSON.stringify(oEntry)}`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
	}
	
	var aColumns = _.keys(oEntry);
	var aValues = _.values(oEntry);
	
	_.each(aColumns, function(oColumns,iColIndex) {
		oValidationUtils.checkColumn(aMetadata,aColumns[iColIndex],aValues[iColIndex]);    
	});
		
}


/**
 * Check entry
 * 
 * @param  {array} aEntry - entries resulted after a query was executed
 * @param  {string} sEntryType - entry type (main / text)
 * @throws {PlcException} - an exception is thrown if an entry was already changed or if somebody tries to modify an ERP entry 
 */
function checkEntry(aEntry, sEntryType) {
	
    //check if the entry was found
    if (aEntry.length === 0) {
		const sLogMessage = `Entry in metadata not found.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = sEntryType;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }

    //check if the source is PLC; if the source is ERP, the entry cannot be changed
    if (aEntry[0]._SOURCE != aSource[0]) {
		const sLogMessage = `Only entries with PLC source can be changed.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.validationObj = {"validationInfoCode": ValidationInfoCode.SOURCE_ERP};
		throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
    }

}

/**
 * Check if an object has all mandatory properties filled
 * 
 * @param  {object} oObject            - object
 * @param  {array} aMandatoryProperty  - mandatory properties
 * @throws {PlcException}              - if mandatory property are missing or are empty 
 */
function checkMandatoryProperties(oObject,aMandatoryProperties){
	
	let aObjMissingProperties = [];
	let aObjNullOrEmptyProperties = [];
	
	aMandatoryProperties.forEach(sMandatoryProperty => {
		    if ((!_.has(oObject, sMandatoryProperty))) {
		         aObjMissingProperties.push(_.zipObject(["columnId"],[sMandatoryProperty]));
			 }
			 else if((oObject[sMandatoryProperty]==="")||(oObject[sMandatoryProperty]===null))
			 {
			     aObjNullOrEmptyProperties.push(_.zipObject(["columnId"],[sMandatoryProperty]));
			 }
	});
		
	if (aObjMissingProperties.length !== 0 || aObjNullOrEmptyProperties.length !== 0){
	    let sLogMessage;
	    let oMessageDetails = new MessageDetails();
    	if (aObjMissingProperties.length !== 0) {
    	    sLogMessage = `Please enter mandatory properties: ${_.map(aObjMissingProperties,"columnId").join(", ")}`;
    		oMessageDetails.validationObj = {"columnIds": aObjMissingProperties, "validationInfoCode": ValidationInfoCode.MISSING_MANDATORY_ENTRY};
    	}
    	
    	else {
    	    sLogMessage = `Null or empty is not allowed on key fields: ${_.map(aObjNullOrEmptyProperties,"columnId").join(", ")}`;
    		oMessageDetails.validationObj = {"columnIds": aObjNullOrEmptyProperties, "validationInfoCode": ValidationInfoCode.VALUE_ERROR};
    	}
    	
    	$.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
	}
}



/**
 * Find records in table
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  aKeyPlcTableColumns  - array of key columns
 * @param   {array}  aKeyPlcValuesColumns - array of key values
 * @param   {object} hQuery               - hQuery object
 * @returns {array}  aFoundEntry          - array of found entries 
 */
function findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    
    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);
    
    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');
    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
        if (sColumnName != '_VALID_FROM' && sColumnName != 'VALID_FROM') {
        	if (_.isString(aKeyPlcValuesColumns[iIndex])) {
        		aStmtBuilder.push(' UPPER("'+ sColumnName + '") = ?');
        		aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());    
        	} else {
        		aStmtBuilder.push(sColumnName + " = ?");
        		aValues.push(aKeyPlcValuesColumns[iIndex]);
        	}
        } else {
        	aStmtBuilder.push(sColumnName + " = ?");
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        if (iIndex < aKeyPlcTableColumns.length - 1) {
        	aStmtBuilder.push(" AND ");
        }
    });

    var aFoundEntry = hQuery.statement(aStmtBuilder.join("")).execute(aValues);
    return aFoundEntry;
}

/**
 * Find valid records in PLC table
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  aKeyPlcTableColumns  - array of key columns
 * @param   {array}  aKeyPlcValuesColumns - array of key values
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} hQuery               - hQuery object
 * @returns {array}  aFoundEntry          - array of found entries 
 */
function findValidEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, isVersioned) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];
    
    if (isVersioned == undefined){
       isVersioned = true;
    }

    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
    	if (_.isString(aKeyPlcValuesColumns[iIndex])) {
    		aStmtBuilder.push(' UPPER("'+ sColumnName + '") = ?');
    		aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());    
    	} else {
    		aStmtBuilder.push(sColumnName + " = ?");
    		aValues.push(aKeyPlcValuesColumns[iIndex]);
    	}
    	if (iIndex < aKeyPlcTableColumns.length-1) {
			aStmtBuilder.push(" AND ");
        }  
    });

    if (isVersioned == true){
        aStmtBuilder.push(" AND _VALID_FROM <= ? AND _VALID_TO is null ");
        aValues.push(sMasterDataDate);
    }
    
    var aFoundEntry = hQuery.statement(aStmtBuilder.join("")).execute(aValues);

    return aFoundEntry;

}

/**
 * Find newer records in PLC table 
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  aKeyPlcTableColumns  - array of key columns
 * @param   {array}  aKeyPlcValuesColumns - array of key values
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} hQuery               - hQuery object
 * @returns {array}  aFoundEntry          - array of found entries 
 */
function findNewerEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
    	if (_.isString(aKeyPlcValuesColumns[iIndex])) {
    		aStmtBuilder.push(' UPPER("'+ sColumnName + '") = ?');
    		aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());    
    	} else {
    		aStmtBuilder.push(sColumnName + " = ?");
    		aValues.push(aKeyPlcValuesColumns[iIndex]);
    	}
        aStmtBuilder.push(" AND ");
    });

    aStmtBuilder.push(" _VALID_FROM > ? order by _VALID_FROM");
    aValues.push(sMasterDataDate);

    var aFoundEntry = hQuery.statement(aStmtBuilder.join("")).execute(aValues);

    return aFoundEntry;

}

/**
 * Find older records in PLC table 
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  aKeyPlcTableColumns  - array of key columns
 * @param   {array}  aKeyPlcValuesColumns - array of key values
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} hQuery               - hQuery object
 * @returns {array}  aFoundEntry          - array of found entries 
 */
function findOlderEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select top 1 * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
    	if (_.isString(aKeyPlcValuesColumns[iIndex])) {
    		aStmtBuilder.push(' UPPER("'+ sColumnName + '") = ?');
    		aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());    
    	} else {
    		aStmtBuilder.push(sColumnName + " = ?");
    		aValues.push(aKeyPlcValuesColumns[iIndex]);
    	}
        aStmtBuilder.push(" AND ");
    });

    aStmtBuilder.push(" _VALID_TO is not null order by _VALID_FROM desc");
    
    var aFoundEntry = hQuery.statement(aStmtBuilder.join("")).execute(aValues);

    return aFoundEntry;

}


/**
 * Get number of valid records in PLC table
 * 
 * @param   {string} sTableName      - table name
 * @param   {array}  aTableColumns   - array of columns
 * @param   {array}  aTableValues    - array of column values
 * @param   {date}   sMasterDataDate - master data date
 * @param   {object} hQuery          - hQuery object
 * @returns {int}    iRowCount       - number of records 
 */
function getNumberOfValidEntriesInTable(sTableName, aTableColumns, aTableValues, bIsVersioned, sMasterDataDate, hQuery) {

	var aValues = [];
    var aStmtBuilder = [];
    var bVersionCheck = true;
    
    checkTableNameNonEmpty(sTableName);   
    checkColumnAndValueLengthsAreEqual(aTableColumns[0], aTableValues);
    
    
    aStmtBuilder.push('select count(*) as rowcount from "' + sTableName + '" where ');
    
    _.each(aTableColumns, function(aColumnNames, iIndexTC) {
    	_.each(aColumnNames, function(sColumnName, iIndexCN) {
    		aStmtBuilder.push(sColumnName + " = ?");
    		aValues.push(aTableValues[iIndexCN]);
    		if (iIndexCN < aColumnNames.length - 1) {
    			aStmtBuilder.push(" AND ");
    		}  
    	});
    	if (iIndexTC < aTableColumns.length - 1) {
    		aStmtBuilder.push(" OR ");
    	} 
    });
    
    if(!helpers.isNullOrUndefined(bIsVersioned)) 
		bVersionCheck = bIsVersioned === false ? false : true;
    
    if(bVersionCheck) {
    	aStmtBuilder.push(' and _VALID_FROM <= ? and _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
    }	
    
    var aResult = hQuery.statement(aStmtBuilder.join("")).execute(aValues);
    var iRowCount = parseInt(aResult[0].ROWCOUNT, 10);
    
    return iRowCount;

}

/**
 * Update PLC entry, by setting _VALID_TO = sMasterDataDate
 * 
 * @param  {string} sTableName           - table name
 * @param  {array}  aKeyPlcTableColumns  - array of key columns
 * @param  {array}  aKeyPlcValuesColumns - array of key column values
 * @param  {date}   sMasterDataDate      - master data date
 * @param  {object} hQuery               - hQuery object
 * @throws {PlcException}                - if there is no entry to update 
 */
function updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    
    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE ');
    aValues.push(sMasterDataDate);

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
        aStmtBuilder.push(sColumnName + " = ?");
        aValues.push(aKeyPlcValuesColumns[iIndex]);
        if (iIndex < aKeyPlcTableColumns.length - 1) {
        	aStmtBuilder.push(" AND ");
        }  
    });

    var iResult = hQuery.statement(aStmtBuilder.join("")).execute(aValues);

    if (iResult == 0) {
		const sLogMessage = `Entry was not deleted.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }

}

/**
 * Update PLC entries, by setting _VALID_TO = sMasterDataDate
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  aKeyPlcTableColumns  - array of (partial) key columns
 * @param   {array}  aKeyPlcValuesColumns - array of (partial) key column values
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} hQuery               - hQuery object
 * @returns {int}    iRowCount            - number of updated records  
 */
function updateEntriesWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    
    checkTableNameNonEmpty(sTableName);
    checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE ');
    aValues.push(sMasterDataDate);

    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
        aStmtBuilder.push(sColumnName + " = ?");
        aValues.push(aKeyPlcValuesColumns[iIndex]);
        aStmtBuilder.push(" AND ");  
    });

    aStmtBuilder.push(" _VALID_FROM <= ? AND _VALID_TO is null ");
    aValues.push(sMasterDataDate);

    var iResult = hQuery.statement(aStmtBuilder.join("")).execute(aValues);

    return iResult;

}

/**
 * Remove row from PLC table
 * 
 * @param   {object} oObject              - object (containing key fields & values)
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} oConfiguration       - configuration containing: business object name, array with some key fields, other objects in which this object is used
 * @param   {object} hQuery               - hQuery object
 * @returns {object} oObject              - object (containing key fields & values)  
 */
function removeRow(oObject,sMasterDataDate,oConfiguration,hQuery){
	
	var sTableName     = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	
	var aPartialKeyPlcTableColumns      = oConfiguration.aPartialKeyPlcTableColumns;
	var aKeyPlcTableColumns             = aPartialKeyPlcTableColumns.concat(["_VALID_FROM"]);
	var aPartialKeyPlcNotMandatory		= oConfiguration.aPartialKeyPlcNotMandatory;
	var aPartialKeyPlcTableColumnValues = getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
	var aKeyPlcTableColumnValues        = aPartialKeyPlcTableColumnValues.concat([oObject["_VALID_FROM"]]);
	
	//check mandatory fields
	var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aKeyPlcTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aKeyPlcTableColumns;

	checkMandatoryProperties(oObject,aMandatoryProperties);
    	
	//check if an entry with this key exists
	var aEntryToBeDeleted = findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);
	checkEntry(aEntryToBeDeleted, AdministrationObjType.MAIN_OBJ);
	
    //check if it was already changed (conflict!)
    if (aEntryToBeDeleted[0]._VALID_TO != null) {
        var aCurrentRecords = findValidEntriesInTable(sTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {//was already deleted
        	return oObject;
        }else{//was already updated
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : aCurrentRecords[0]._VALID_FROM,
        	    "userId" :  aCurrentRecords[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.UPDATE,
        	    "objType" : AdministrationObjType.MAIN_OBJ
			};
        }
		const sLogMessage = `The entry was already changed by another user.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
	
	//check if the object is in use, in other tables
	if (oConfiguration.UsedInBusinessObjects) {
	    checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery);
	}
	
	//delete entry from main table
	updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, sMasterDataDate, hQuery);
	
	//there is no need to delete from extension table; in extension table there is no _VALID_TO
	
	if(sTextTableName !== '')
	{
    	//delete entries from text table
    	var aTextRecords = findValidEntriesInTable(sTextTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    	var iDeletedTextRecords = updateEntriesWithValidToInTable(sTextTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    	if (iDeletedTextRecords !== aTextRecords.length) {
			const sLogMessage = `Not all text entries were deleted.`;
    		$.trace.error(sLogMessage);
    		const oMessageDetails = new MessageDetails();
    		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
    }
    
	var aDeletedEntry = findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);
	
	//return deleted entry
	return aDeletedEntry[0];
}

/**
 * Delete a text entry in PLC text table (+checks)
 * 
 * @param   {object} oTextObject     - the object/entry that will be deleted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @returns {object} oResult         - object containing deleted entity
 */

function removeTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery){
	
	var oResult = {};
	var sPlcTableName                       = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sPlcTextTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	var aPartialKeyPlcTableColumns          = oConfiguration.aPartialKeyPlcTableColumns;
	var aPartialKeyPlcNotMandatory			= oConfiguration.aPartialKeyPlcNotMandatory;
	var aPartialKeyPlcTableColumnValues     = getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
	var aPartialKeyPlcTextTableColumns      = aPartialKeyPlcTableColumns.concat(["LANGUAGE"]);
	var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"]]);
	var aKeyPlcTextTableColumns             = aPartialKeyPlcTableColumns.concat(["LANGUAGE","_VALID_FROM"]);
	var aKeyPlcTextTableColumnValues        = aPartialKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"],oTextObject["_VALID_FROM"]]);
	
	//check mandatory fields
	var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aKeyPlcTextTableColumns;

	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	
	//check if an entry with this key exists
	var aEntryToBeDeleted = findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);
	checkEntry(aEntryToBeDeleted,AdministrationObjType.TEXT_OBJ);
	
    //check if it was already changed (conflict!)
    if (aEntryToBeDeleted[0]._VALID_TO != null) {
        var aCurrentRecords = findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {//was already deleted
        	return oTextObject;
        }else{//was already updated
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : aCurrentRecords[0]._VALID_FROM,
        	    "userId" :  aCurrentRecords[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.UPDATE,
        	    "objType" : AdministrationObjType.TEXT_OBJ
			};
        }
		const sLogMessage = `The entry was already changed by another user.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
    
	//delete entry from main table
	updateEntryWithValidToInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
    
	var aDeletedEntry = findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);
	
	//return deleted entry
	return aDeletedEntry[0];
	
}

/**
 * Check if a business object is in use
 * 
 * @param   {object} oObject              - object (containing key fields & values)
 * @param   {date}   sMasterDataDate      - master data date
 * @param   {object} oConfiguration       - configuration containing: business object name, array with some key fields, other objects in which this object is used
 * @param   {object} hQuery               - hQuery object
 * @throws  {PlcException}                - if the object is in use   
 */
function checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery){
	
	var aTableColumnsInMainObject = [];
	var aUsedInBusinessObjects    = [];
	var aObjUsedInBusinessObjects = [];
	
	aTableColumnsInMainObject=oConfiguration.aPartialKeyPlcTableColumns;
	var aTableValuesInMainObject = getColumnKeyValues(aTableColumnsInMainObject, oObject);
	
	_.each(oConfiguration.UsedInBusinessObjects, function(oBusinessObjectDetails, iIndex) {
		var sTableName = "";		
		if(oBusinessObjectDetails["TableName"])
			sTableName = oBusinessObjectDetails["TableName"];
		else
			sTableName = Resources[oBusinessObjectDetails["BusinessObjectName"]].dbobjects.plcTable;
		var iRowCount = getNumberOfValidEntriesInTable(sTableName, oBusinessObjectDetails["FieldsName"], aTableValuesInMainObject, oBusinessObjectDetails["IsVersioned"], sMasterDataDate, hQuery);
		if (iRowCount > 0) {
			aUsedInBusinessObjects.push(oBusinessObjectDetails["BusinessObjectName"]);
		}
	});
	
	if (aUsedInBusinessObjects.length !== 0){
		aUsedInBusinessObjects = _.uniq(aUsedInBusinessObjects);
		_.each(aUsedInBusinessObjects, function(sBusinessObjectName) {
			aObjUsedInBusinessObjects.push(_.zipObject(["businessObj"],[sBusinessObjectName]));
		});
		const sLogMessage = `The entry cannot be deleted. It's used in business objects: ${aUsedInBusinessObjects.join(", ")}`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.validationObj = {"dependencyObjects": aObjUsedInBusinessObjects, "validationInfoCode": ValidationInfoCode.DEPENDENCY_ERROR};
		throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
	}
	
}


/**
 * Insert entry in PLC table
 * 
 * @param   {string} sTableName      - table name
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {int}    iSource         - source (1-PLC, 2-ERP)
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertEntryInPlcTable(sTableName, oObject, sMasterDataDate, iSource, helper) {
   
    return insertNewEntryInPlcTable(sTableName, oObject, sMasterDataDate, null, iSource, helper);

}

/**
 * Insert old entry in PLC table (having _VALID_TO set)
 * 
 * @param   {string} sTableName      - table name
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {string} sValidToTimestamp - valid_to timestamp
 * @param   {int}    iSource         - source (1-PLC, 2-ERP)
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertNewEntryInPlcTable(sTableName, oObject, sMasterDataDate, sValidToTimestamp, iSource, helper) {

    var aExcludeProperies = [];
    aExcludeProperies.push("_VALID_FROM");
    aExcludeProperies.push("_VALID_TO");
    aExcludeProperies.push("_SOURCE");
    aExcludeProperies.push("_CREATED_BY");
   
    var oGeneratedValues = {
        "_VALID_FROM": sMasterDataDate,
        "_VALID_TO": sValidToTimestamp,
        "_SOURCE": iSource,
        "_CREATED_BY":$.getPlcUsername()
    };

    var oSettings = {
        TABLE: sTableName,
        PROPERTIES_TO_EXCLUDE: aExcludeProperies,
        GENERATED_PROPERTIES: oGeneratedValues
    };

    var oResult = helper.insertNewEntity(oObject, oSettings);

    return oResult;

}

/**
 * Insert a text entry in PLC text table (+checks)
 * 
 * @param   {object} oTextObject     - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields, array with text fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery,helper){

	var oResult = {};
	var sPlcTableName                       = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sPlcTextTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	var aPartialKeyPlcTableColumns          = oConfiguration.aPartialKeyPlcTableColumns;
	var aPartialKeyPlcNotMandatory			= oConfiguration.aPartialKeyPlcNotMandatory;
	var aTextColumns                        = oConfiguration.aTextColumns;
	var aMandatoryTextColumns               = oConfiguration.aMandatoryTextColumns;
	var aPartialKeyPlcTableColumnValues     = getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
	var aPartialKeyPlcTextTableColumns      = aPartialKeyPlcTableColumns.concat(["LANGUAGE"]);
	var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"]]);
	
	//check mandatory fields
	var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aPartialKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aPartialKeyPlcTextTableColumns;
	
	if(_.isArray(aTextColumns))
		aMandatoryProperties = _.union(aMandatoryProperties,aTextColumns);
	
	if(_.isArray(aMandatoryTextColumns))
		aMandatoryProperties = _.union(aMandatoryProperties,aMandatoryTextColumns);
	
	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	
	//check the language
	var aLanguages = getMaintainableLanguages(sMasterDataDate, hQuery);
	if(!_.includes(aLanguages,oTextObject.LANGUAGE)){
		const sLogMessage = `There is no language ${oTextObject.LANGUAGE}.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		oMessageDetails.businessObj = BusinessObjectTypes.Language;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
	}
	      
    //check if there is a main valid entry with the same partial key in PLC
    var aFoundPlcRecords = findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length === 0) {
    	//if there is no valid entity, check if the main entity was available in the past
    	var aFoundOldPlcRecord = findOlderEntryInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, hQuery);
    	if (aFoundOldPlcRecord.length === 0) {
    		//the main entity was not available in the past
			const sLogMessage = `There is no entry in main PLC table. You cannot create a text.`;
			$.trace.error(sLogMessage);
			const oMessageDetails = new MessageDetails();
			oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    	}else{
    		//the main entity was available in the past and was deleted;
    		const oMessageDetails = new MessageDetails();
        	oMessageDetails.administrationConflictDetailsObj = {
    			"newValidFromDate" : null,
        	    "userId" :  aFoundOldPlcRecord[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.DELETE,
        	    "objType" : AdministrationObjType.MAIN_OBJ
    		};
			const sLogMessage = `The entry was already deleted by another user.`;
    		$.trace.error(sLogMessage);
    		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    	}    	
    }
    
    //check if there is another valid text entry with the same partial key in PLC
    var aFoundPlcTextRecords = findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcTextRecords.length !== 0) {
		const oMessageDetails = new MessageDetails();
    	oMessageDetails.administrationConflictDetailsObj = {
			"newValidFromDate" : aFoundPlcTextRecords[0]._VALID_FROM,
    	    "userId" :  aFoundPlcTextRecords[0]._CREATED_BY,
    	    "operationUserId" : MessageOperation.CREATE,
    	    "objType" : AdministrationObjType.TEXT_OBJ
		};
		const sLogMessage = `The entry was already added by another user.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
    
    //insert data in main table
    helper.setHQuery(hQuery);
    oResult = insertEntryInPlcTable(sPlcTextTableName, oTextObject, sMasterDataDate, aSource[0], helper);
	    	
	return oResult;
	
}

/**
 * Insert an entry in PLC main table (+checks)
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,helper){
	
	var oResult = {};
	var sPlcTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sErpTableName                   = Resources[oConfiguration.sObjectName].dbobjects.erpTable;
	var aPartialKeyPlcTableColumns      = oConfiguration.aPartialKeyPlcTableColumns;
	var aPartialKeyPlcNotMandatory		= oConfiguration.aPartialKeyPlcNotMandatory;
	var aKeyErpTableColumns             = oConfiguration.aKeyErpTableColumns;
	var aPartialKeyPlcTableColumnValues = getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
		
	//check mandatory fields
    var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aPartialKeyPlcTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aPartialKeyPlcTableColumns;
	
	if (oConfiguration.aFieldsNotNull) //other not null fields
		aMandatoryProperties = _.union(aMandatoryProperties,oConfiguration.aFieldsNotNull);
	
	checkMandatoryProperties(oObject,aMandatoryProperties);
	
    //check if there is another valid entry with the same partial key in PLC
    var aFoundPlcRecords = findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length !== 0) {
		const sLogMessage = `Entry already exists in PLC.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
    }
    
    //check if there is another valid entry with the same key in ERP
    if (sErpTableName !== ""){
        var aFoundErpRecords = findEntryInTable(sErpTableName, aKeyErpTableColumns, aPartialKeyPlcTableColumnValues, hQueryRepl);
        if (aFoundErpRecords.length !== 0) {
			const sLogMessage = `Entry already exists in ERP.`;
			$.trace.error(sLogMessage);
			const oMessageDetails = new MessageDetails();
			oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
			throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
        }
    }
    
    //insert data in main table
    helper.setHQuery(hQuery);
    oResult = insertEntryInPlcTable(sPlcTableName, oObject, sMasterDataDate, aSource[0], helper);
    
    return oResult;
}

/**
 * Copy an entry(+ corresponding texts) from ERP tables to PLC tables (+checks)
 * 
 * @param   {array}  aKeyFieldsPlcTable         - array of (partial) key columns
 * @param   {array}  aKeyFieldsValuesPlcTable   - array of (partial) key column values
 * @param   {string} sMasterDataDate            - master data timestamp
 * @param   {object} oConfiguration             - configuration containing: business object name, array with some key fields from PLC, array with key fields from ERP, mappings between ERP and PLC
 * @param   {object} hQuery                     - hQuery object
 * @param   {object} hQueryRepl                 - hQueryRepl object
 * @param   {object} helper                     - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult                    - object containing copied entity
 */
function copyDataFromErp(aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {
	
	var aPartialKeyPlcTableColumns      = oConfiguration.aPartialKeyPlcTableColumns;
	var aKeyErpTableColumns             = oConfiguration.aKeyErpTableColumns;
	var sErpTableName                   = Resources[oConfiguration.sObjectName].dbobjects.erpTable;
	var sPlcTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sErpTextTableName               = Resources[oConfiguration.sObjectName].dbobjects.erpTextTable;
	var sPlcTextTableName               = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	var oMappingMainErpPlc              = oConfiguration.oMappingMainErpPlc;
	var oMappingTextErpPlc              = oConfiguration.oMappingTextErpPlc;
	
	if(aKeyFieldsPlcTable.length!==aPartialKeyPlcTableColumns.length){
		const sLogMessage = `Different key fields.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);		
	}
	if (sErpTableName === ""){
		const sLogMessage = `There is no erp table for business object ${oConfiguration.sObjectName}.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
	}
	
	var aErpMainEntries = findEntryInTable(sErpTableName, aKeyErpTableColumns, aKeyFieldsValuesPlcTable, hQueryRepl);   
    if (aErpMainEntries.length !== 1) {
		const sLogMessage = `No ${oConfiguration.sObjectName} found in ${sErpTableName}`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.businessObj = oConfiguration.sObjectName;
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }
    var oPlcEntry = createPlcObjectFromErpObject(aErpMainEntries[0], oMappingMainErpPlc);
    
    helper.setHQuery(hQuery);
    var sValidToTimestamp = null;
    //check if there is a newer version in plc table
    var aPlcNewerEntries = findNewerEntriesInTable(sPlcTableName, aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, hQuery);
    if (aPlcNewerEntries.length !== 0) {//if there is a newer version, take _VALID_FROM
    	sValidToTimestamp = aPlcNewerEntries[0]._VALID_FROM;
    }
    
    var oResult = insertNewEntryInPlcTable(sPlcTableName, oPlcEntry, sMasterDataDate, sValidToTimestamp,aSource[1], helper);
        
    //insert also the texts
    var aErpTextEntries = [];
    if(oConfiguration.aKeyErpTextTableColumnsException){
        //sometimes the text table does not have similar keys as the main entity;e.g document status
    	var aValues  = getColumnKeyValues(oConfiguration.aKeyErpTextTableColumnsException, aErpMainEntries[0]);
    	aErpTextEntries = findEntryInTable(sErpTextTableName, oConfiguration.aKeyErpTextTableColumnsException, aValues, hQueryRepl);
    }
    else{
        aErpTextEntries = findEntryInTable(sErpTextTableName, aKeyErpTableColumns, aKeyFieldsValuesPlcTable, hQueryRepl); 
    }
    	
    _.each(aErpTextEntries, function(oErpTextEntry, iIndex) {
    	var oPlcTextEntry = createPlcObjectFromErpObject(oErpTextEntry, oMappingTextErpPlc);
    	helper.setHQuery(hQuery);
        var sTextValidToTimestamp = null;
        //check if there is a newer version in plc table
        var aPlcFields = [];
        if(oConfiguration.aKeyErpTextTableColumnsException)//this is set only in document status
        	aPlcFields = getPlcFields(oConfiguration.aKeyErpTextTableColumnsException,oMappingMainErpPlc);
        else
        	aPlcFields = aKeyFieldsPlcTable;
    	var aPartialKeyPlcTextTableColumns   = aPlcFields.concat(["LANGUAGE"]);
    	var aPartialKeyPlcTableColumnValues  = getColumnKeyValues(aPartialKeyPlcTextTableColumns, oPlcTextEntry);
    	var aPlcNewerTextEntries = findNewerEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
	    if (aPlcNewerTextEntries.length !== 0) {//if there is a newer version, take _VALID_FROM
	    	sTextValidToTimestamp = aPlcNewerTextEntries[0]._VALID_FROM;
	    }
    	insertNewEntryInPlcTable(sPlcTextTableName, oPlcTextEntry, sMasterDataDate, sTextValidToTimestamp,aSource[1], helper);
    });	
            
    return oResult;
	
}

/**
 * Get an array of plc fields
 * 
 * @param   {object} aErpFields - array of erp fields
 * @param   {object} oMappingErpPlc - object containing the mapping between ERP and PLC fields
 * @returns {object} aPlcFields - array of plc fields
 */
function getPlcFields(aErpFields,oMappingErpPlc){
	var aPlcFields = [];
	 _.each(aErpFields, function(sColumn, iIndex) {
         if (!_.isUndefined(oMappingErpPlc[sColumn])) {
        	 aPlcFields.push(oMappingErpPlc[sColumn]);
         }
     });
	 return aPlcFields;
}

/**
 * Create a PLC object from an ERP object
 * 
 * @param   {object} oErpEntry      - ERP object
 * @param   {object} oMappingErpPlc - object containing the mapping between ERP and PLC fields
 * @returns {object} oPlcObject     - created PLC entry
 */
function createPlcObjectFromErpObject(oErpEntry, oMappingErpPlc) {
	
	var aFieldsPlc = [];
    var aValuesPlc = [];
    
    var aFieldsErp = _.keys(oErpEntry);
        	
	 _.each(aFieldsErp, function(sColumn, iIndex) {
         if (!_.isUndefined(oMappingErpPlc[sColumn])) {
        	 aFieldsPlc.push(oMappingErpPlc[sColumn]);
             aValuesPlc.push(oErpEntry[sColumn]);
         }
     });
	
     if (aFieldsPlc.length === 0) {
		 const sLogMessage = `No mapping between PLC and ERP`;
		 $.trace.error(sLogMessage);
		 const oMessageDetails = new MessageDetails();
		 throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
     }

     var oPlcObject = _.zipObject(aFieldsPlc, aValuesPlc);

     return oPlcObject;

}

/**
 * Checks is all the column values from an object are empty
 * 
 * @param   {array}  aColumns          - array with column names
 * @param   {object} oObject           - object 
 * @returns {bool}   bAllValuesEmpty   - result containing a boolean value: true if all the fields are empty / false in the other case
 */
function areAllFieldsEmpty(aColumns, oObject){
	
	var bAllValuesEmpty = true;

	//if all values are empty, continue with the next referenced object
	_.each(aColumns, function(iColumn, iIndex) {

	    if ((!helpers.isNullOrUndefined(oObject[iColumn])) && (oObject[iColumn].length !== 0)) {
	        bAllValuesEmpty = false;
	        return {}; //break
	    }

	});
	
	return bAllValuesEmpty;
	
}

/**
 * Update an entry in PLC main table (+checks); An update = delete + insert
 * 
 * @param   {object} oObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing updated entity
 */
function updateRow(oObject,sMasterDataDate,oConfiguration,hQuery,helper){
	
	var oResult = {};
	
	var sTableName                      = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var aPartialKeyPlcTableColumns      = oConfiguration.aPartialKeyPlcTableColumns;
	var aPartialKeyPlcNotMandatory		= oConfiguration.aPartialKeyPlcNotMandatory;
	var aKeyPlcTableColumns             = aPartialKeyPlcTableColumns.concat(["_VALID_FROM"]);
	var aPartialKeyPlcTableColumnValues = getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
	var aKeyPlcTableColumnValues        = aPartialKeyPlcTableColumnValues.concat([oObject["_VALID_FROM"]]);
	
	//check mandatory fields
    var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aKeyPlcTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aKeyPlcTableColumns;
	
	if (oConfiguration.aFieldsNotNull) //other not null fields
		aMandatoryProperties = _.union(aMandatoryProperties,oConfiguration.aFieldsNotNull);
	
	checkMandatoryProperties(oObject,aMandatoryProperties);
	
	//check if an entry with this key exists
	var aEntryToBeUpdated = findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);
	checkEntry(aEntryToBeUpdated, AdministrationObjType.MAIN_OBJ);
	
	//check is some fields (which sould not be changed) are changed
	//aFieldsNotChangeble
	if (oConfiguration.aFieldsNotChangeble) {
	    checkNotChangebleFields(oObject, aEntryToBeUpdated[0], oConfiguration.aFieldsNotChangeble);
	}
	
    //check if it was already changed (conflict!)
    if (aEntryToBeUpdated[0]._VALID_TO != null) {
        var aCurrentRecords = findValidEntriesInTable(sTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {//was already deleted
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : null,
        	    "userId" :  aEntryToBeUpdated[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.DELETE,
        	    "objType" : AdministrationObjType.MAIN_OBJ
			};
        }else{//was already updated
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : aCurrentRecords[0]._VALID_FROM,
        	    "userId" :  aCurrentRecords[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.UPDATE,
        	    "objType" : AdministrationObjType.MAIN_OBJ
			};
        }
		const sLogMessage = `The entry was already changed by another user.`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
		
	//delete entry from main table
	updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, sMasterDataDate, hQuery);
	
	//insert data in main table
	helper.setHQuery(hQuery);
    oResult = insertEntryInPlcTable(sTableName, oObject, sMasterDataDate, aSource[0], helper);
    
    return oResult;
	
}

/**
 * Check if some fields (that should not be changed) were changed.
 * 
 * @param   {object} oChangedObject       - changed object 
 * @param   {object} oOriginalObject      - original object
 * @param   {array}  aFieldsNotChangeble  - array with fields that should not be changed
 * @throws  {PlcException}                - if (not changeble) fields were changed   
 */
function checkNotChangebleFields(oChangedObject, oOriginalObject, aFieldsNotChangeble){
	
	_.some(aFieldsNotChangeble, function(sField, iIndex) {
		if(oChangedObject[sField]!== oOriginalObject[sField]){
			const sLogMessage = `Field ${sField} should not be changed.`;
			$.trace.error(sLogMessage);
			const oMessageDetails = new MessageDetails();
			oMessageDetails.validationObj = {"columnId":sField, "validationInfoCode": ValidationInfoCode.READONLY_FIELD_ERROR};
			throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);			
		}
	});
	
}


/**
 * Update a text entry in PLC text table (+checks); An update = delete + insert
 * 
 * @param   {object} oTextObject     - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields, array with text fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function updateTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery,helper){

	var oResult = {};
	var sPlcTableName                       = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sPlcTextTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	var aPartialKeyPlcTableColumns          = oConfiguration.aPartialKeyPlcTableColumns;
	var aPartialKeyPlcNotMandatory			= oConfiguration.aPartialKeyPlcNotMandatory;
	var aMandatoryTextColumns               = oConfiguration.aMandatoryTextColumns;
	var aPartialKeyPlcTableColumnValues     = getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
	var aPartialKeyPlcTextTableColumns      = aPartialKeyPlcTableColumns.concat(["LANGUAGE"]);
	var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"]]);
	var aKeyPlcTextTableColumns             = aPartialKeyPlcTableColumns.concat(["LANGUAGE","_VALID_FROM"]);
	var aKeyPlcTextTableColumnValues        = aPartialKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"],oTextObject["_VALID_FROM"]]);
		
	//check mandatory fields
	var aMandatoryProperties = [];
	if(_.isArray(aPartialKeyPlcNotMandatory))
		aMandatoryProperties = _.difference(aKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);//exclude not mandatory keys
	else
		aMandatoryProperties = aKeyPlcTextTableColumns;
	
	if(_.isArray(aMandatoryTextColumns))
		aMandatoryProperties = _.union(aMandatoryProperties,aMandatoryTextColumns);
	
	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	          
	//check if an entry with this key exists
	var aEntryToBeUpdated = findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);
	checkEntry(aEntryToBeUpdated, AdministrationObjType.TEXT_OBJ);
	
    //check if it was already changed (conflict!)
    if (aEntryToBeUpdated[0]._VALID_TO != null) {
        var aCurrentRecords = findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {//was already deleted
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : null,
        	    "userId" :  aEntryToBeUpdated[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.DELETE,
        	    "objType" : AdministrationObjType.TEXT_OBJ
			};
        }else{//was already updated
        	oMessageDetails.administrationConflictDetailsObj = {
				"newValidFromDate" : aCurrentRecords[0]._VALID_FROM,
        	    "userId" :  aCurrentRecords[0]._CREATED_BY,
        	    "operationUserId" : MessageOperation.UPDATE,
        	    "objType" : AdministrationObjType.TEXT_OBJ
			};
        }
		const sLogMessage = `The entry was already changed by another user`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
    
    //check if there is a main valid entry with the same partial key in PLC
    var aFoundPlcRecords = findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length === 0) {
		const sLogMessage = `There is no entry in main PLC table. You cannot create a text`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }
		
	//delete entry from main table
	updateEntryWithValidToInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
	
	 //insert data in main table
    helper.setHQuery(hQuery);
    oResult = insertEntryInPlcTable(sPlcTextTableName, oTextObject, sMasterDataDate, aSource[0], helper);
    
    return oResult;
    	
}

/**
 * Gets the name of all the text tables from Masterdata Resources
 * 
 * @returns {array} aUsedInBusinessObjects - contains objects with the keys from each text table
 */
this.getMasterdataTextTable = function() {
	 //get all erp text tables
	 var aAllObjects = _.keys(Resources);
	 var oBusinessObject = {};
	 var aUsedInBusinessObjects = [];
    _.each(aAllObjects, function(sObjectName, iIndex) {
        if (Resources[sObjectName].dbobjects.erpTextTable != "") {
        	oBusinessObject = {
        		"BusinessObjectName":sObjectName,
        		"TableName" : Resources[sObjectName].dbobjects.plcTextTable,
				"FieldsName": [ ["LANGUAGE"] ]
        	};
        	aUsedInBusinessObjects.push(oBusinessObject);
        }
    });
    return aUsedInBusinessObjects;
};

/**
 * Gets maintainable languages
 * 
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} hQuery          - hQuery object
 * @returns {array} aLanguages       - contains all maintainable languages
 */
function getMaintainableLanguages(sMasterDataDate, hQuery) {

	var aColumns = ["TEXTS_MAINTAINABLE"];
	var aValues = [1];
	var aMaintainableLanguages = [];
	
	var aAllLanguages = findValidEntriesInTable(Resources[BusinessObjectTypes.Language].dbobjects.plcTable, aColumns, aValues, sMasterDataDate, hQuery, true);
	if(_.isArray(aAllLanguages))
		aMaintainableLanguages = _.map(aAllLanguages,'LANGUAGE');
	
	return aMaintainableLanguages;
}


/**
 * Copy unchanged rows in order to have the _VALID_FROM in all the tables. In this way it will be easier to handle the conflicts
 * 
 * @param   {object} aChangedObjectsKeys  - array of changed object keys 
 * @param   {date}   oConfiguration       - configuration 
 * @param   {date}   sMasterDataDate      - current date 
 * @param   {object} hQuery               - hQuery object
 * @param   {object} helper               - helper object
 * @returns {object} oCopiedObjects       - object containing copied main entities and  copied texts
 */
function copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, helper){
	
	var oCopiedObjects = {
			main:[],
			texts:[]					
	};
		
	var oWhereCondition = createWhereConditionWithValidEntriesNotChanged(aChangedObjectsKeys,sMasterDataDate);
	
	//select all current and unchanged entries from main table
	var aMainUnchangedEntries = findEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oWhereCondition, hQuery);
	
	//select all current and unchanged entries from text table
	var aTextUnchangedEntries = findEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oWhereCondition, hQuery);
	
	if((aMainUnchangedEntries.length==0)&&(aTextUnchangedEntries.length==0))
		return oCopiedObjects;
	
	//update _VALID_TO, _CREATED_BY for all current and unchanged entries (from main + text tables)
	var iUpdatedMainEntries = updateEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oWhereCondition, sMasterDataDate, hQuery);
	var iUpdatedTextEntries = updateEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oWhereCondition, sMasterDataDate, hQuery);
	
	if((aMainUnchangedEntries.length != iUpdatedMainEntries)||(aTextUnchangedEntries.length != iUpdatedTextEntries)){
		const sLogMessage = `The number of updated items is not correct`;
		const oMessageDetails = new MessageDetails();
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
	}
	
	//insert the entries (to main + text entries) with updated _VALID_FROM, _CREATED_BY
    helper.setHQuery(hQuery);
    _.each(aMainUnchangedEntries,function(oObject){
    	var oResult = insertEntryInPlcTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oObject, sMasterDataDate, aSource[0], helper);
    	oCopiedObjects.main.push(oResult);
    });
    _.each(aTextUnchangedEntries,function(oObject){
    	var oResult = insertEntryInPlcTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oObject, sMasterDataDate, aSource[0], helper);
    	oCopiedObjects.texts.push(oResult);
    });
	
    return oCopiedObjects;	
}

/**
 * Find valid records in PLC table which weret changed
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  oWhereCondition      - condition object containing the string and values
 * @param   {object} hQuery               - hQuery object
 * @returns {array}  aFoundEntry          - array of found entries 
 */
function findEntriesInTable(sTableName, oWhereCondition, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    checkTableNameNonEmpty(sTableName);
    
    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');
    aStmtBuilder = aStmtBuilder.concat(oWhereCondition.conditions);
    aValues = aValues.concat(oWhereCondition.values);
   
    aFoundEntries = hQuery.statement(aStmtBuilder.join("")).execute(aValues);
    return aFoundEntries;

}

/**
 * Create the where condition in order to find/update the main/text records that were not changed
 * 
 * @param   {object} aChangedObjectsKeys  - array of changed object keys 
 * @param   {date} sMasterDataDate        - current date 
 * @returns {object}  oWhereCondition     - object containing the condition and the values that will be replaced in the condition 
 */
function createWhereConditionWithValidEntriesNotChanged(aChangedObjectsKeys,sMasterDataDate){
	
	var oWhereCondition = {
			conditions:[],
			values:[]						
	};
	
	oWhereCondition.conditions.push('(');
	_.each(aChangedObjectsKeys, function(oChangedObject,iIndex){
		var aKeys = _.keys(oChangedObject,iIndex);
		oWhereCondition.conditions.push('(');
		_.each(aKeys, function(sKey,iIdx){
			oWhereCondition.conditions.push(sKey + ' = ? ');
			oWhereCondition.values.push(oChangedObject[sKey]);
			if (iIdx < aKeys.length-1) {
				oWhereCondition.conditions.push(" AND ");
	        }  
		});
		oWhereCondition.conditions.push(')');
		if (iIndex < aChangedObjectsKeys.length-1) {
			oWhereCondition.conditions.push(" OR ");
        }  
	});
	oWhereCondition.conditions.push(')');
	oWhereCondition.conditions.push(' AND _VALID_FROM < ? AND _VALID_FROM <> ? AND _VALID_TO is NULL');
	oWhereCondition.conditions.push(' AND _SOURCE = ?');
	oWhereCondition.values.push(sMasterDataDate);
	oWhereCondition.values.push(sMasterDataDate);//to remove the entries that were added with this request
	oWhereCondition.values.push(aSource[0]);
	return oWhereCondition;
	
}

/**
 * Update PLC entries, by setting _VALID_TO = sMasterDataDate
 * 
 * @param   {string} sTableName           - table name
 * @param   {array}  oWhereCondition      - condition object containing the string and values
 * @param   {object} hQuery               - hQuery object
 * @returns {int}    iRowCount            - number of updated records  
 */
function updateEntriesInTable(sTableName, oWhereCondition, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var iResult = 0;
    
    checkTableNameNonEmpty(sTableName);
    
    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? , _CREATED_BY = ?  WHERE ');
    aValues.push(sMasterDataDate);
    aValues.push($.getPlcUsername());
    
    aStmtBuilder = aStmtBuilder.concat(oWhereCondition.conditions);
    aValues = aValues.concat(oWhereCondition.values);

    iResult = hQuery.statement(aStmtBuilder.join("")).execute(aValues);
    return iResult;

}

// functions used for operations on non-versioned tables

/**
 * Check an entry before inserting it in PLC main table. The data is not versioned
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 */
function checkNotVersionedMainRowToInsert(oObject,sMasterDataDate,oConfiguration,hQuery, hQueryRepl){

	var sPlcTableName                   = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aCompleteKeyPlcTableColumns     = oConfiguration.aCompleteKeyPlcTableColumns;
    var aMandatoryMainColumns           = oConfiguration.aMandatoryMainColumns;

	var aCompleteKeyPlcTableColumnValues = getColumnKeyValues(aCompleteKeyPlcTableColumns, oObject);
		
	//check mandatory fields
	checkMandatoryProperties(oObject,aMandatoryMainColumns);
	
    //check if there is another valid entry with the same key in PLC
    var aFoundPlcRecords = findValidEntriesInTable(sPlcTableName, aCompleteKeyPlcTableColumns, aCompleteKeyPlcTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcRecords.length !== 0) {
		const sLogMessage = `Entry already exists in PLC.`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
    }
    
}

/**
 * Inserts an entry in PLC main table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,helper){
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var oResult = insertRowInTable(sPlcTableName, oObject,sMasterDataDate,hQuery,hQueryRepl,helper);
    return oResult;
}

/**
 * Check a text entry before inserting it in PLC text table. The data is not versioned
 * 
 * @param   {object} oTextObject     - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 */
function checkNotVersionedTextRowToInsert(oTextObject,sMasterDataDate,oConfiguration,hQuery, hQueryRepl){

	var sPlcTableName                        = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
	var sPlcTextTableName                    = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
	var aTextColumns                         = oConfiguration.aTextColumns;
    var aCompleteKeyPlcTableColumns          = oConfiguration.aCompleteKeyPlcTableColumns;
	var aCompleteKeyPlcTableColumnValues     = getColumnKeyValues(aCompleteKeyPlcTableColumns, oTextObject);
	var aCompleteKeyPlcTextTableColumns      = aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
	var aCompleteKeyPlcTextTableColumnValues = aCompleteKeyPlcTableColumnValues.concat([oTextObject["LANGUAGE"]]);
	
	var aMandatoryProperties = aCompleteKeyPlcTextTableColumns;
	aMandatoryProperties = _.union(aMandatoryProperties,aTextColumns);
	
	//check mandatory fields
	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	
	//check the language
	var aLanguages = getMaintainableLanguages(sMasterDataDate, hQuery);
	if(!_.includes(aLanguages,oTextObject.LANGUAGE)){
		const sLogMessage = `There is no language ${oTextObject.LANGUAGE}`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		oMessageDetails.businessObj = BusinessObjectTypes.Language;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
	}
		
    //check if there is a main valid entry
    var aFoundPlcRecords = findValidEntriesInTable(sPlcTableName, aCompleteKeyPlcTableColumns, aCompleteKeyPlcTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcRecords.length === 0) {
		const sLogMessage = `There is no entry in main PLC table. You cannot create a text`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }
    
    //check if there is another valid text entry with the same key in PLC
    var aFoundPlcTextRecords = findValidEntriesInTable(sPlcTextTableName, aCompleteKeyPlcTextTableColumns, aCompleteKeyPlcTextTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcTextRecords.length !== 0) {
		const oMessageDetails = new MessageDetails();
    	oMessageDetails.administrationConflictDetailsObj = {
			"newValidFromDate" : aFoundPlcTextRecords[0].LAST_MODIFIED_ON,
    	    "userId" :  aFoundPlcTextRecords[0].LAST_MODIFIED_BY,
    	    "operationUserId" : MessageOperation.CREATE,
    	    "objType" : AdministrationObjType.TEXT_OBJ
		};
		const sLogMessage = `The entry was already added by another user`;
		$.trace.error(sLogMessage);
		throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
    
}

/**
 * Inserts a text entry in PLC text table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertNotVersionedTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,helper){
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var oResult = insertRowInTable(sPlcTableName,oTextObject,sMasterDataDate,hQuery,hQueryRepl,helper);
    return oResult;

}

/**
 * Inserts an entry in a table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {string} sPlcTableName   - table name
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function insertRowInTable(sPlcTableName, oObject,sMasterDataDate,hQuery,hQueryRepl,helper){
    helper.setHQuery(hQuery);

    var aExcludeProperies = [];
    aExcludeProperies.push("CREATED_ON");
    aExcludeProperies.push("CREATED_BY");
    aExcludeProperies.push("LAST_MODIFIED_ON");
    aExcludeProperies.push("LAST_MODIFIED_BY");
   
    var oGeneratedValues = {
        "CREATED_ON": sMasterDataDate,
        "CREATED_BY": $.getPlcUsername(),
        "LAST_MODIFIED_ON": sMasterDataDate,
        "LAST_MODIFIED_BY":$.getPlcUsername()
    };

    var oSettings = {
        TABLE: sPlcTableName,
        PROPERTIES_TO_EXCLUDE: aExcludeProperies,
        GENERATED_PROPERTIES: oGeneratedValues
    };

    var oResult = helper.insertNewEntity(oObject, oSettings);

    return oResult; 
}

/**
 * Check an entry before deleting it from PLC main table. The data is not versioned
 * 
 * @param   {object} oObject         - the object/entry that will be deleted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 */
function checkNotVersionedMainRowToRemove(oObject,sMasterDataDate,oConfiguration,hQuery){
	
    var aCompleteKeyPlcTableColumns      = oConfiguration.aCompleteKeyPlcTableColumns;

	//check mandatory fields
	var aMandatoryProperties = [];
	aMandatoryProperties = _.union(aCompleteKeyPlcTableColumns,["LAST_MODIFIED_ON"]);
	checkMandatoryProperties(oObject,aMandatoryProperties);
    	
	//check conflicts
	checkNotVersionedEntryHasConflicts(oObject,sMasterDataDate,oConfiguration,hQuery,AdministrationObjType.MAIN_OBJ);
	
	//check if the object is in use, in other tables
	if (oConfiguration.UsedInBusinessObjects) {
	    checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery);
	} 
	
}

/**
 * Deletes an entry from PLC main table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be deleted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 */
function removeNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery){
    var sTableName           = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aKeyPlcTableColumns  = oConfiguration.aCompleteKeyPlcTableColumns;
    var aKeyPlcValuesColumns = getColumnKeyValues(aKeyPlcTableColumns, oObject);
    var iRemove              = removeRowsFromTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns,sMasterDataDate,hQuery);
    var sTextTableName       = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var iRemoveTexts          = removeRowsFromTable(sTextTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns,sMasterDataDate,hQuery);
    
}

/**
 * Check an entry before deleting it from PLC text table. The data is not versioned
 * 
 * @param   {object} oTextObject     - the object/entry that will be deleted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 */
function checkNotVersionedTextRowToRemove(oTextObject,sMasterDataDate,oConfiguration,hQuery){
	
     var aKeyPlcTableColumns  = oConfiguration.aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
    
	//check mandatory fields
	var aMandatoryProperties = [];
	aMandatoryProperties = _.union(aKeyPlcTableColumns,["LAST_MODIFIED_ON"]);
	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	
	//check conflicts
	checkNotVersionedEntryHasConflicts(oTextObject,sMasterDataDate,oConfiguration,hQuery,AdministrationObjType.TEXT_OBJ);
   		
}

/**
 * Deletes an entry from PLC text table. The data is not versioned.
 * 
 * @param   {object} oTextObject     - the object/entry that will be deleted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 */
function removeNotVersionedTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery){
    var sTextTableName       = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aKeyPlcTableColumns  = oConfiguration.aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
    var aKeyPlcValuesColumns = getColumnKeyValues(aKeyPlcTableColumns, oTextObject);
    var iResult = removeRowsFromTable(sTextTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns,sMasterDataDate,hQuery);
}

/**
 * Removes an entry from a table. The data is not versioned.
 * 
 * @param   {array} aKeyPlcTableColumns   - array with key fields
 * @param   {array} aKeyPlcValuesColumns  - array with key field values
 * @param   {string} sMasterDataDate      - master data timestamp
 * @param   {string} sTableName           - table name
 * @param   {object} hQuery          - hQuery object
 */
function removeRowsFromTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns,sMasterDataDate,hQuery){
    var aStmtBuilder = [];
    var aValues = [];
    aStmtBuilder.push('delete from "' + sTableName + '" WHERE ');
    _.each(aKeyPlcTableColumns, function(sColumnName, iIndex) {
        	if (_.isString(aKeyPlcValuesColumns[iIndex])) {
        		aStmtBuilder.push(' UPPER("'+ sColumnName + '") = ?');
        		aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());    
        	} else {
        		aStmtBuilder.push(sColumnName + " = ?");
        		aValues.push(aKeyPlcValuesColumns[iIndex]);
        	}
        if (iIndex < aKeyPlcTableColumns.length - 1) {
        	aStmtBuilder.push(" AND ");
        }
    });
    var iResult = hQuery.statement(aStmtBuilder.join("")).execute(aValues); 
    
}

/**
 * Check an entry before updating it in PLC main table. The data is not versioned
 * 
 * @param   {object} oObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 */
function checkNotVersionedMainRowToUpdate(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl){
	
	var aMandatoryMainColumns            = oConfiguration.aMandatoryMainColumns;
		
	//check mandatory fields
	var aMandatoryProperties = [];
	aMandatoryProperties = _.union(aMandatoryMainColumns,["LAST_MODIFIED_ON"]);
	checkMandatoryProperties(oObject,aMandatoryProperties);
	
	//check conflicts
	checkNotVersionedEntryHasConflicts(oObject,sMasterDataDate,oConfiguration,hQuery,AdministrationObjType.MAIN_OBJ);

}

/**
 * Updates a main entry in PLC main table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function updateNotVersionedMainRow(oObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,helper){
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    var oResult = updateRowInTable(sPlcTableName, oObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;
}

/**
 * Check an entry before updating it in PLC text table. The data is not versioned
 * 
 * @param   {object} oTextObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 */
function checkNotVersionedTextRowToUpdate(oTextObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl){

    var aKeyPlcTableColumns  = oConfiguration.aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
       
	//check mandatory fields
	var aMandatoryProperties = [];
	aMandatoryProperties = _.union(aKeyPlcTableColumns,["LAST_MODIFIED_ON"]);
	checkMandatoryProperties(oTextObject,aMandatoryProperties);
	
	//check conflicts
	checkNotVersionedEntryHasConflicts(oTextObject,sMasterDataDate,oConfiguration,hQuery,AdministrationObjType.TEXT_OBJ);
   	  	
}

/**
 * Updates a text entry in PLC text table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function updateNotVersionedTextRow(oTextObject,sMasterDataDate,oConfiguration,hQuery,hQueryRepl,helper){
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aKeyPlcTableColumns  = oConfiguration.aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
    var oResult = updateRowInTable(sPlcTableName, oTextObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;
    
}

/**
 * Updates an entry in a table. The data is not versioned.
 * 
 * @param   {object} oObject         - the object/entry that will be updated
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {string} sPlcTableName   - table name
 * @param   {string} aKeyPlcTableColumns - array with keys
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 * @param   {object} helper          - helper object (from persistency-helper.xsjslib)
 * @returns {object} oResult         - object containing inserted entity
 */
function updateRowInTable(sPlcTableName, oObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper){
    var aKeyPlcValuesColumns = getColumnKeyValues(aKeyPlcTableColumns, oObject);
    var oWhereCondition = _.zipObject(aKeyPlcTableColumns,aKeyPlcValuesColumns);
       
    helper.setHQuery(hQuery);

    var oUpdatedObject = _.clone(oObject);
    oUpdatedObject.LAST_MODIFIED_ON         = sMasterDataDate;
    oUpdatedObject.LAST_MODIFIED_BY = $.getPlcUsername();
    
	var oSettings = {
			TABLE : sPlcTableName,
			WHERE_PROPERTIES : oWhereCondition
	};
	
    var oResult = helper.updateEntity(oUpdatedObject, oSettings);
    
    // retrieve the entry from table with all the columns
    var oFinalResult = findValidEntriesInTable(sPlcTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, false)[0];
    
    return oFinalResult; 
}

/**
 * Check if an entry has conflicts. The data is not versioned
 * 
 * @param   {object} oObject         - the object/entry that will be inserted
 * @param   {string} sMasterDataDate - master data timestamp
 * @param   {object} oConfiguration  - configuration containing: business object name, array with some key fields
 * @param   {object} hQuery          - hQuery object
 * @param   {object} hQueryRepl      - hQueryRepl object
 */
function checkNotVersionedEntryHasConflicts(oObject,sMasterDataDate,oConfiguration,hQuery,sObjectType){
	
	 var sTableName = '';
	 var aKeyPlcTableColumns  = [];
	 
	 if(sObjectType===AdministrationObjType.TEXT_OBJ){
		 sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
		 aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(["LANGUAGE"]);
	 }
	 else{
		 sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
		 aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
	 }
	 
	 var aKeyPlcValuesColumns = getColumnKeyValues(aKeyPlcTableColumns, oObject);
	
	 //check if an entry with this key exists
	 var aEntryToBeMaintained = findValidEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, false);
	 //check if the entry was found
	 if (aEntryToBeMaintained.length === 0) {
		const sLogMessage = `Entry not found`;
		$.trace.error(sLogMessage);
		const oMessageDetails = new MessageDetails();
		oMessageDetails.administrationObjType = sObjectType;
		throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
	  }
		
	  //check if it was already changed (conflict!)
	  if (aEntryToBeMaintained[0].LAST_MODIFIED_ON.getTime() != Date.parse(oObject.LAST_MODIFIED_ON)) {
	        const oMessageDetails = new MessageDetails();
		   	oMessageDetails.administrationConflictDetailsObj = {
		   		"newValidFromDate" : aEntryToBeMaintained[0].LAST_MODIFIED_ON,
		   	    "userId" :  aEntryToBeMaintained[0].LAST_MODIFIED_BY,
		   	    "operationUserId" : MessageOperation.UPDATE,
		   	    "objType" : sObjectType
			};
			const sLogMessage = `The entry was already changed by another user.`;
			$.trace.error(sLogMessage);
			throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
	  }
}

/**
 * Check if object exists
 *
 * @param {objects} oObject - object
 *  the parameters will be filled like this: 
		e.g => var oObject = {"CURRENCY_ID":"EUR"}; 
 * @param {string} sMasterDataDate - current timestamp
 * @param {string} sBusinessObjectName - business object name	
 */
this.checkObjectExists = function(oObject, sMasterDataDate, sBusinessObjectName, hQuery) {

	if (!_.isObject(oObject)) {
		const oMessageDetails = new MessageDetails();
        const sClientMsg = "oObject must be a valid object.";
        const sServerMsg = `${sClientMsg} oObject: ${JSON.stringify(oObject)}.`;
		$.trace.error(sServerMsg);
		throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
	}

	var aKeyPlcTableColumns = Resources[sBusinessObjectName].configuration.aKeyColumns;

	if(!areAllFieldsEmpty(aKeyPlcTableColumns, oObject)){
		var aFieldsValuesMainPlcTable = getColumnKeyValues(aKeyPlcTableColumns, oObject);
		var aFoundPlcRecords = findValidEntriesInTable(Resources[sBusinessObjectName].dbobjects.plcTable, aKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate, hQuery, Resources[sBusinessObjectName].configuration.IsVersioned); 
		if (aFoundPlcRecords.length === 0) {
			const oMessageDetails = new MessageDetails();
			const sClientMsg = "No such object found in masterdata table.";
			const sServerMsg = `${sClientMsg} oObject: ${JSON.stringify(oObject)}, table: ${Resources[sBusinessObjectName].dbobjects.plcTable}.`;
			$.trace.error(sServerMsg);
			oMessageDetails.businessObj = sBusinessObjectName;
			oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
			throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
		}
	}
};