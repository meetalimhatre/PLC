const _ = $.require('lodash');
const helpers = $.require('../../util/helpers');
const aSource = $.require('../../util/masterdataResources').Source;
const Resources = $.require('../../util/masterdataResources').MasterdataResource;
const BusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
const BusinessObjectValidatorUtils = $.require('../../validator/businessObjectValidatorUtils').BusinessObjectValidatorUtils;

const MessageLibrary = $.require('../../../xs/util/message');
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;
const Severity = MessageLibrary.Severity;
const Code = MessageLibrary.Code;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const AdministrationObjType = MessageLibrary.AdministrationObjType;
const MessageOperation = MessageLibrary.Operation;

/**
 * Helper to check if table name is not empty.
 */
async function checkTableNameNonEmpty(sTableName) {
    if (sTableName === '') {
        const sLogMessage = `Table name is not specified.`;
        const oMessageDetails = new MessageDetails();
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }
}

/**
 * Helper to check if the column and value arrays have the same length.
 */
async function checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns) {
    if (aKeyPlcTableColumns.length !== aKeyPlcValuesColumns.length) {
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
async function getFilterObjectFromFilterString(sFilter, aMetadata) {
    var oFilter = {};
    var oColumns = [];
    var oValues = [];

    var oValidationUtils = await new BusinessObjectValidatorUtils();

    if (helpers.isNullOrUndefined(sFilter)) {
        return oFilter;
    }

    await helpers.checkStringSQLInjection(sFilter);


    var aOperations = sFilter.split('&');
    _.each(aOperations, function (sOperation, iIndex) {
        if (sOperation.indexOf('CONTROLLING_AREA_ID') !== -1) {
            var aOperands = sOperation.split('=');
            oValidationUtils.checkColumn(aMetadata, aOperands[0], aOperands[1]);
            oColumns.push(aOperands[0]);
            oValues.push(aOperands[1]);
        }
    });

    oFilter = _.zipObject(oColumns, oValues);
    return oFilter;
}









async function createResponse(oRecord, section, e, operation, oResultObject) {
    var oResult = {};
    var aEntity = [];
    var entitySection = {};
    const oMessageDetails = new MessageDetails();

    oResult.code = e.code.code;
    oResult.type = e.type;
    oResult.severity = Severity.ERROR;
    oResult.operation = operation;

    if (!helpers.isNullOrUndefined(e.details)) {
        aEntity.push(oRecord);
        if (!helpers.isNullOrUndefined(e.details.administrationObjType))
            oMessageDetails.administrationObjType = e.details.administrationObjType;
        if (!helpers.isNullOrUndefined(e.details.validationObj))
            oMessageDetails.validationObj = e.details.validationObj;
        if (!helpers.isNullOrUndefined(e.details.businessObj))
            oMessageDetails.businessObj = e.details.businessObj;
        if (!helpers.isNullOrUndefined(e.details.administrationConflictDetailsObj))
            oMessageDetails.administrationConflictDetailsObj = e.details.administrationConflictDetailsObj;
    } else {
        aEntity.push(oRecord);
    }

    entitySection[section] = aEntity;
    oMessageDetails.administrationObj = entitySection;
    oResult.details = oMessageDetails;
    oResultObject.errors.push(oResult);
}








function getColumnKeyValues(aKeyPlcTableColumns, oObject) {

    var aColumnKeyValues = [];

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        aColumnKeyValues.push(oObject[sColumnName]);
    });

    return aColumnKeyValues;

}








async function checkColumns(oEntry, aMetadata) {
    var oValidationUtils = await new BusinessObjectValidatorUtils();

    if (!_.isObject(oEntry)) {
        const oMessageDetails = new MessageDetails();
        oMessageDetails.validationObj = { 'validationInfoCode': ValidationInfoCode.SYNTACTIC_ERROR };

        const sClientMsg = 'Error in checkColumns: oEntry must be a valid object';
        const sServerMsg = `${ sClientMsg } oEntry: ${ JSON.stringify(oEntry) }`;
        $.trace.error(sServerMsg);
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
    }

    var aColumns = _.keys(oEntry);
    var aValues = _.values(oEntry);

    _.each(aColumns, function (oColumns, iColIndex) {
        oValidationUtils.checkColumn(aMetadata, aColumns[iColIndex], aValues[iColIndex]);
    });

}









async function checkEntry(aEntry, sEntryType) {


    if (aEntry.length === 0) {
        const sLogMessage = `Entry in metadata not found.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = sEntryType;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    if (aEntry[0]._SOURCE != aSource[0]) {
        const sLogMessage = `Only entries with PLC source can be changed.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.validationObj = { 'validationInfoCode': ValidationInfoCode.SOURCE_ERP };
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
    }

}








async function checkMandatoryProperties(oObject, aMandatoryProperties) {

    let aObjMissingProperties = [];
    let aObjNullOrEmptyProperties = [];

    aMandatoryProperties.forEach(sMandatoryProperty => {
        if (!_.has(oObject, sMandatoryProperty)) {
            aObjMissingProperties.push(_.zipObject(['columnId'], [sMandatoryProperty]));
        } else if (oObject[sMandatoryProperty] === '' || oObject[sMandatoryProperty] === null) {
            aObjNullOrEmptyProperties.push(_.zipObject(['columnId'], [sMandatoryProperty]));
        }
    });

    if (aObjMissingProperties.length !== 0 || aObjNullOrEmptyProperties.length !== 0) {
        let sLogMessage;
        let oMessageDetails = new MessageDetails();
        if (aObjMissingProperties.length !== 0) {
            sLogMessage = `Please enter mandatory properties: ${ _.map(aObjMissingProperties, 'columnId').join(', ') }`;
            oMessageDetails.validationObj = {
                'columnIds': aObjMissingProperties,
                'validationInfoCode': ValidationInfoCode.MISSING_MANDATORY_ENTRY
            };
        } else {
            sLogMessage = `Null or empty is not allowed on key fields: ${ _.map(aObjNullOrEmptyProperties, 'columnId').join(', ') }`;
            oMessageDetails.validationObj = {
                'columnIds': aObjNullOrEmptyProperties,
                'validationInfoCode': ValidationInfoCode.VALUE_ERROR
            };
        }

        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
    }
}












async function findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');
    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        if (sColumnName != '_VALID_FROM' && sColumnName != 'VALID_FROM') {
            if (_.isString(aKeyPlcValuesColumns[iIndex])) {
                aStmtBuilder.push(' UPPER("' + sColumnName + '") = ?');
                aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());
            } else {
                aStmtBuilder.push(sColumnName + ' = ?');
                aValues.push(aKeyPlcValuesColumns[iIndex]);
            }
        } else {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        if (iIndex < aKeyPlcTableColumns.length - 1) {
            aStmtBuilder.push(' AND ');
        }
    });

    var aFoundEntry = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    return aFoundEntry;
}











async function findValidEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, isVersioned) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    if (isVersioned == undefined) {
        isVersioned = true;
    }

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        if (_.isString(aKeyPlcValuesColumns[iIndex])) {
            aStmtBuilder.push(' UPPER("' + sColumnName + '") = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());
        } else {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        if (iIndex < aKeyPlcTableColumns.length - 1) {
            aStmtBuilder.push(' AND ');
        }
    });

    if (isVersioned == true) {
        aStmtBuilder.push(' AND _VALID_FROM <= ? AND _VALID_TO is null ');
        aValues.push(sMasterDataDate);
    }

    var aFoundEntry = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

    return aFoundEntry;

}











async function findNewerEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        if (_.isString(aKeyPlcValuesColumns[iIndex])) {
            aStmtBuilder.push(' UPPER("' + sColumnName + '") = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());
        } else {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        aStmtBuilder.push(' AND ');
    });

    aStmtBuilder.push(' _VALID_FROM > ? order by _VALID_FROM');
    aValues.push(sMasterDataDate);

    var aFoundEntry = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

    return aFoundEntry;

}











async function findOlderEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('select top 1 * from "' + sTableName + '" WHERE ');

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        if (_.isString(aKeyPlcValuesColumns[iIndex])) {
            aStmtBuilder.push(' UPPER("' + sColumnName + '") = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());
        } else {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        aStmtBuilder.push(' AND ');
    });

    aStmtBuilder.push(' _VALID_TO is not null order by _VALID_FROM desc');

    var aFoundEntry = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

    return aFoundEntry;

}












async function getNumberOfValidEntriesInTable(sTableName, aTableColumns, aTableValues, bIsVersioned, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var bVersionCheck = true;

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aTableColumns[0], aTableValues);


    aStmtBuilder.push('select count(*) as rowcount from "' + sTableName + '" where ');

    _.each(aTableColumns, function (aColumnNames, iIndexTC) {
        _.each(aColumnNames, function (sColumnName, iIndexCN) {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aTableValues[iIndexCN]);
            if (iIndexCN < aColumnNames.length - 1) {
                aStmtBuilder.push(' AND ');
            }
        });
        if (iIndexTC < aTableColumns.length - 1) {
            aStmtBuilder.push(' OR ');
        }
    });

    if (!helpers.isNullOrUndefined(bIsVersioned))
        bVersionCheck = bIsVersioned === false ? false : true;

    if (bVersionCheck) {
        aStmtBuilder.push(' and _VALID_FROM <= ? and _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
    }

    var aResult = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    var iRowCount = parseInt(aResult[0].ROWCOUNT, 10);

    return iRowCount;

}











async function updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE ');
    aValues.push(sMasterDataDate);

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        aStmtBuilder.push(sColumnName + ' = ?');
        aValues.push(aKeyPlcValuesColumns[iIndex]);
        if (iIndex < aKeyPlcTableColumns.length - 1) {
            aStmtBuilder.push(' AND ');
        }
    });

    var iResult = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

    if (iResult == 0) {
        const sLogMessage = `Entry was not deleted.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }

}











async function updateEntriesWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];

    await checkTableNameNonEmpty(sTableName);
    await checkColumnAndValueLengthsAreEqual(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE ');
    aValues.push(sMasterDataDate);

    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        aStmtBuilder.push(sColumnName + ' = ?');
        aValues.push(aKeyPlcValuesColumns[iIndex]);
        aStmtBuilder.push(' AND ');
    });

    aStmtBuilder.push(' _VALID_FROM <= ? AND _VALID_TO is null ');
    aValues.push(sMasterDataDate);

    var iResult = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

    return iResult;

}










async function removeRow(oObject, sMasterDataDate, oConfiguration, hQuery) {

    var sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;

    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aKeyPlcTableColumns = aPartialKeyPlcTableColumns.concat(['_VALID_FROM']);
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
    var aKeyPlcTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oObject['_VALID_FROM']]);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aKeyPlcTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aKeyPlcTableColumns;

    await checkMandatoryProperties(oObject, aMandatoryProperties);


    var aEntryToBeDeleted = await findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);
    await checkEntry(aEntryToBeDeleted, AdministrationObjType.MAIN_OBJ);


    if (aEntryToBeDeleted[0]._VALID_TO != null) {
        var aCurrentRecords = await findValidEntriesInTable(sTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {
            return oObject;
        } else {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': aCurrentRecords[0]._VALID_FROM,
                'userId': aCurrentRecords[0]._CREATED_BY,
                'operationUserId': MessageOperation.UPDATE,
                'objType': AdministrationObjType.MAIN_OBJ
            };
        }
        const sLogMessage = `The entry was already changed by another user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }


    if (oConfiguration.UsedInBusinessObjects) {
        await checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery);
    }


    await updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, sMasterDataDate, hQuery);



    if (sTextTableName !== '') {

        var aTextRecords = await findValidEntriesInTable(sTextTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        var iDeletedTextRecords = await updateEntriesWithValidToInTable(sTextTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        if (iDeletedTextRecords !== aTextRecords.length) {
            const sLogMessage = `Not all text entries were deleted.`;
            $.trace.error(sLogMessage);
            const oMessageDetails = new MessageDetails();
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
    }

    var aDeletedEntry = await findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);


    return aDeletedEntry[0];
}











async function removeTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery) {

    var oResult = {};
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sPlcTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
    var aPartialKeyPlcTextTableColumns = aPartialKeyPlcTableColumns.concat(['LANGUAGE']);
    var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject['LANGUAGE']]);
    var aKeyPlcTextTableColumns = aPartialKeyPlcTableColumns.concat([
        'LANGUAGE',
        '_VALID_FROM'
    ]);
    var aKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([
        oTextObject['LANGUAGE'],
        oTextObject['_VALID_FROM']
    ]);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aKeyPlcTextTableColumns;

    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    var aEntryToBeDeleted = await findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);
    await checkEntry(aEntryToBeDeleted, AdministrationObjType.TEXT_OBJ);


    if (aEntryToBeDeleted[0]._VALID_TO != null) {
        var aCurrentRecords = await findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {
            return oTextObject;
        } else {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': aCurrentRecords[0]._VALID_FROM,
                'userId': aCurrentRecords[0]._CREATED_BY,
                'operationUserId': MessageOperation.UPDATE,
                'objType': AdministrationObjType.TEXT_OBJ
            };
        }
        const sLogMessage = `The entry was already changed by another user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }


    await updateEntryWithValidToInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);

    var aDeletedEntry = await findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);


    return aDeletedEntry[0];

}










async function checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery) {

    var aTableColumnsInMainObject = [];
    var aUsedInBusinessObjects = [];
    var aObjUsedInBusinessObjects = [];

    aTableColumnsInMainObject = oConfiguration.aPartialKeyPlcTableColumns;
    var aTableValuesInMainObject = await getColumnKeyValues(aTableColumnsInMainObject, oObject);

    _.each(oConfiguration.UsedInBusinessObjects, async function (oBusinessObjectDetails, iIndex) {
        var sTableName = '';
        if (oBusinessObjectDetails['TableName'])
            sTableName = oBusinessObjectDetails['TableName'];
        else
            sTableName = Resources[oBusinessObjectDetails['BusinessObjectName']].dbobjects.plcTable;
        var iRowCount = await getNumberOfValidEntriesInTable(sTableName, oBusinessObjectDetails['FieldsName'], aTableValuesInMainObject, oBusinessObjectDetails['IsVersioned'], sMasterDataDate, hQuery);
        if (iRowCount > 0) {
            aUsedInBusinessObjects.push(oBusinessObjectDetails['BusinessObjectName']);
        }
    });

    if (aUsedInBusinessObjects.length !== 0) {
        aUsedInBusinessObjects = _.uniq(aUsedInBusinessObjects);
        _.each(aUsedInBusinessObjects, function (sBusinessObjectName) {
            aObjUsedInBusinessObjects.push(_.zipObject(['businessObj'], [sBusinessObjectName]));
        });
        const sLogMessage = `The entry cannot be deleted. It's used in business objects: ${ aUsedInBusinessObjects.join(', ') }`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.validationObj = {
            'dependencyObjects': aObjUsedInBusinessObjects,
            'validationInfoCode': ValidationInfoCode.DEPENDENCY_ERROR
        };
        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
    }

}












async function insertEntryInPlcTable(sTableName, oObject, sMasterDataDate, iSource, helper) {

    return await insertNewEntryInPlcTable(sTableName, oObject, sMasterDataDate, null, iSource, helper);

}












function insertNewEntryInPlcTable(sTableName, oObject, sMasterDataDate, sValidToTimestamp, iSource, helper) {

    var aExcludeProperies = [];
    aExcludeProperies.push('_VALID_FROM');
    aExcludeProperies.push('_VALID_TO');
    aExcludeProperies.push('_SOURCE');
    aExcludeProperies.push('_CREATED_BY');

    var oGeneratedValues = {
        '_VALID_FROM': sMasterDataDate,
        '_VALID_TO': sValidToTimestamp,
        '_SOURCE': iSource,
        '_CREATED_BY': $.getPlcUsername()
    };

    var oSettings = {
        TABLE: sTableName,
        PROPERTIES_TO_EXCLUDE: aExcludeProperies,
        GENERATED_PROPERTIES: oGeneratedValues
    };

    var oResult = helper.insertNewEntity(oObject, oSettings);

    return oResult;

}











async function insertTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery, helper) {

    var oResult = {};
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sPlcTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aTextColumns = oConfiguration.aTextColumns;
    var aMandatoryTextColumns = oConfiguration.aMandatoryTextColumns;
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
    var aPartialKeyPlcTextTableColumns = aPartialKeyPlcTableColumns.concat(['LANGUAGE']);
    var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject['LANGUAGE']]);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aPartialKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aPartialKeyPlcTextTableColumns;

    if (_.isArray(aTextColumns))
        aMandatoryProperties = _.union(aMandatoryProperties, aTextColumns);

    if (_.isArray(aMandatoryTextColumns))
        aMandatoryProperties = _.union(aMandatoryProperties, aMandatoryTextColumns);

    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    var aLanguages = await getMaintainableLanguages(sMasterDataDate, hQuery);
    if (!_.includes(aLanguages, oTextObject.LANGUAGE)) {
        const sLogMessage = `There is no language ${ oTextObject.LANGUAGE }.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        oMessageDetails.businessObj = BusinessObjectTypes.Language;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    var aFoundPlcRecords = await findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length === 0) {

        var aFoundOldPlcRecord = await findOlderEntryInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, hQuery);
        if (aFoundOldPlcRecord.length === 0) {

            const sLogMessage = `There is no entry in main PLC table. You cannot create a text.`;
            $.trace.error(sLogMessage);
            const oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        } else {

            const oMessageDetails = new MessageDetails();
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': null,
                'userId': aFoundOldPlcRecord[0]._CREATED_BY,
                'operationUserId': MessageOperation.DELETE,
                'objType': AdministrationObjType.MAIN_OBJ
            };
            const sLogMessage = `The entry was already deleted by another user.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
        }
    }


    var aFoundPlcTextRecords = await findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcTextRecords.length !== 0) {
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationConflictDetailsObj = {
            'newValidFromDate': aFoundPlcTextRecords[0]._VALID_FROM,
            'userId': aFoundPlcTextRecords[0]._CREATED_BY,
            'operationUserId': MessageOperation.CREATE,
            'objType': AdministrationObjType.TEXT_OBJ
        };
        const sLogMessage = `The entry was already added by another user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }


    helper.setHQuery(hQuery);
    oResult = await insertEntryInPlcTable(sPlcTextTableName, oTextObject, sMasterDataDate, aSource[0], helper);

    return oResult;

}












async function insertRow(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {

    var oResult = {};
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sErpTableName = Resources[oConfiguration.sObjectName].dbobjects.erpTable;
    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aKeyErpTableColumns = oConfiguration.aKeyErpTableColumns;
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aPartialKeyPlcTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aPartialKeyPlcTableColumns;

    if (oConfiguration.aFieldsNotNull)
        aMandatoryProperties = _.union(aMandatoryProperties, oConfiguration.aFieldsNotNull);

    await checkMandatoryProperties(oObject, aMandatoryProperties);


    var aFoundPlcRecords = await findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length !== 0) {
        const sLogMessage = `Entry already exists in PLC.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
    }


    if (sErpTableName !== '') {
        var aFoundErpRecords = await findEntryInTable(sErpTableName, aKeyErpTableColumns, aPartialKeyPlcTableColumnValues, hQueryRepl);
        if (aFoundErpRecords.length !== 0) {
            const sLogMessage = `Entry already exists in ERP.`;
            $.trace.error(sLogMessage);
            const oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
            throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
        }
    }


    helper.setHQuery(hQuery);
    oResult = await insertEntryInPlcTable(sPlcTableName, oObject, sMasterDataDate, aSource[0], helper);

    return oResult;
}













async function copyDataFromErp(aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {

    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aKeyErpTableColumns = oConfiguration.aKeyErpTableColumns;
    var sErpTableName = Resources[oConfiguration.sObjectName].dbobjects.erpTable;
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sErpTextTableName = Resources[oConfiguration.sObjectName].dbobjects.erpTextTable;
    var sPlcTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var oMappingMainErpPlc = oConfiguration.oMappingMainErpPlc;
    var oMappingTextErpPlc = oConfiguration.oMappingTextErpPlc;

    if (aKeyFieldsPlcTable.length !== aPartialKeyPlcTableColumns.length) {
        const sLogMessage = `Different key fields.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }
    if (sErpTableName === '') {
        const sLogMessage = `There is no erp table for business object ${ oConfiguration.sObjectName }.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }

    var aErpMainEntries = await findEntryInTable(sErpTableName, aKeyErpTableColumns, aKeyFieldsValuesPlcTable, hQueryRepl);
    if (aErpMainEntries.length !== 1) {
        const sLogMessage = `No ${ oConfiguration.sObjectName } found in ${ sErpTableName }`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.businessObj = oConfiguration.sObjectName;
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }
    var oPlcEntry = await createPlcObjectFromErpObject(aErpMainEntries[0], oMappingMainErpPlc);

    helper.setHQuery(hQuery);
    var sValidToTimestamp = null;

    var aPlcNewerEntries = await findNewerEntriesInTable(sPlcTableName, aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, hQuery);
    if (aPlcNewerEntries.length !== 0) {
        sValidToTimestamp = aPlcNewerEntries[0]._VALID_FROM;
    }

    var oResult = await insertNewEntryInPlcTable(sPlcTableName, oPlcEntry, sMasterDataDate, sValidToTimestamp, aSource[1], helper);


    var aErpTextEntries = [];
    if (oConfiguration.aKeyErpTextTableColumnsException) {

        var aValues = await getColumnKeyValues(oConfiguration.aKeyErpTextTableColumnsException, aErpMainEntries[0]);
        aErpTextEntries = await findEntryInTable(sErpTextTableName, oConfiguration.aKeyErpTextTableColumnsException, aValues, hQueryRepl);
    } else {
        aErpTextEntries = await findEntryInTable(sErpTextTableName, aKeyErpTableColumns, aKeyFieldsValuesPlcTable, hQueryRepl);
    }

    _.each(aErpTextEntries, async function (oErpTextEntry, iIndex) {
        var oPlcTextEntry = await createPlcObjectFromErpObject(oErpTextEntry, oMappingTextErpPlc);
        helper.setHQuery(hQuery);
        var sTextValidToTimestamp = null;

        var aPlcFields = [];
        if (oConfiguration.aKeyErpTextTableColumnsException)
            aPlcFields = await getPlcFields(oConfiguration.aKeyErpTextTableColumnsException, oMappingMainErpPlc);
        else
            aPlcFields = aKeyFieldsPlcTable;
        var aPartialKeyPlcTextTableColumns = aPlcFields.concat(['LANGUAGE']);
        var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTextTableColumns, oPlcTextEntry);
        var aPlcNewerTextEntries = await findNewerEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        if (aPlcNewerTextEntries.length !== 0) {
            sTextValidToTimestamp = aPlcNewerTextEntries[0]._VALID_FROM;
        }
        await insertNewEntryInPlcTable(sPlcTextTableName, oPlcTextEntry, sMasterDataDate, sTextValidToTimestamp, aSource[1], helper);
    });

    return oResult;

}








function getPlcFields(aErpFields, oMappingErpPlc) {
    var aPlcFields = [];
    _.each(aErpFields, function (sColumn, iIndex) {
        if (!_.isUndefined(oMappingErpPlc[sColumn])) {
            aPlcFields.push(oMappingErpPlc[sColumn]);
        }
    });
    return aPlcFields;
}








async function createPlcObjectFromErpObject(oErpEntry, oMappingErpPlc) {

    var aFieldsPlc = [];
    var aValuesPlc = [];

    var aFieldsErp = _.keys(oErpEntry);

    _.each(aFieldsErp, function (sColumn, iIndex) {
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








function areAllFieldsEmpty(aColumns, oObject) {

    var bAllValuesEmpty = true;


    _.each(aColumns, async function (iColumn, iIndex) {

        if (!helpers.isNullOrUndefined(oObject[iColumn]) && oObject[iColumn].length !== 0) {
            bAllValuesEmpty = false;
            return {};
        }

    });

    return bAllValuesEmpty;

}











async function updateRow(oObject, sMasterDataDate, oConfiguration, hQuery, helper) {

    var oResult = {};

    var sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aKeyPlcTableColumns = aPartialKeyPlcTableColumns.concat(['_VALID_FROM']);
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
    var aKeyPlcTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oObject['_VALID_FROM']]);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aKeyPlcTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aKeyPlcTableColumns;

    if (oConfiguration.aFieldsNotNull)
        aMandatoryProperties = _.union(aMandatoryProperties, oConfiguration.aFieldsNotNull);

    await checkMandatoryProperties(oObject, aMandatoryProperties);


    var aEntryToBeUpdated = await findEntryInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, hQuery);
    await checkEntry(aEntryToBeUpdated, AdministrationObjType.MAIN_OBJ);



    if (oConfiguration.aFieldsNotChangeble) {
        await checkNotChangebleFields(oObject, aEntryToBeUpdated[0], oConfiguration.aFieldsNotChangeble);
    }


    if (aEntryToBeUpdated[0]._VALID_TO != null) {
        var aCurrentRecords = await findValidEntriesInTable(sTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': null,
                'userId': aEntryToBeUpdated[0]._CREATED_BY,
                'operationUserId': MessageOperation.DELETE,
                'objType': AdministrationObjType.MAIN_OBJ
            };
        } else {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': aCurrentRecords[0]._VALID_FROM,
                'userId': aCurrentRecords[0]._CREATED_BY,
                'operationUserId': MessageOperation.UPDATE,
                'objType': AdministrationObjType.MAIN_OBJ
            };
        }
        const sLogMessage = `The entry was already changed by another user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }


    await updateEntryWithValidToInTable(sTableName, aKeyPlcTableColumns, aKeyPlcTableColumnValues, sMasterDataDate, hQuery);


    helper.setHQuery(hQuery);
    oResult = await insertEntryInPlcTable(sTableName, oObject, sMasterDataDate, aSource[0], helper);

    return oResult;

}









function checkNotChangebleFields(oChangedObject, oOriginalObject, aFieldsNotChangeble) {

    _.some(aFieldsNotChangeble, async function (sField, iIndex) {
        if (oChangedObject[sField] !== oOriginalObject[sField]) {
            const sLogMessage = `Field ${ sField } should not be changed.`;
            $.trace.error(sLogMessage);
            const oMessageDetails = new MessageDetails();
            oMessageDetails.validationObj = {
                'columnId': sField,
                'validationInfoCode': ValidationInfoCode.READONLY_FIELD_ERROR
            };
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
        }
    });

}












async function updateTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery, helper) {

    var oResult = {};
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sPlcTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
    var aPartialKeyPlcNotMandatory = oConfiguration.aPartialKeyPlcNotMandatory;
    var aMandatoryTextColumns = oConfiguration.aMandatoryTextColumns;
    var aPartialKeyPlcTableColumnValues = await getColumnKeyValues(aPartialKeyPlcTableColumns, oTextObject);
    var aPartialKeyPlcTextTableColumns = aPartialKeyPlcTableColumns.concat(['LANGUAGE']);
    var aPartialKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([oTextObject['LANGUAGE']]);
    var aKeyPlcTextTableColumns = aPartialKeyPlcTableColumns.concat([
        'LANGUAGE',
        '_VALID_FROM'
    ]);
    var aKeyPlcTextTableColumnValues = aPartialKeyPlcTableColumnValues.concat([
        oTextObject['LANGUAGE'],
        oTextObject['_VALID_FROM']
    ]);


    var aMandatoryProperties = [];
    if (_.isArray(aPartialKeyPlcNotMandatory))
        aMandatoryProperties = _.difference(aKeyPlcTextTableColumns, aPartialKeyPlcNotMandatory);
    else
        aMandatoryProperties = aKeyPlcTextTableColumns;

    if (_.isArray(aMandatoryTextColumns))
        aMandatoryProperties = _.union(aMandatoryProperties, aMandatoryTextColumns);

    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    var aEntryToBeUpdated = await findEntryInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, hQuery);
    await checkEntry(aEntryToBeUpdated, AdministrationObjType.TEXT_OBJ);


    if (aEntryToBeUpdated[0]._VALID_TO != null) {
        var aCurrentRecords = await findValidEntriesInTable(sPlcTextTableName, aPartialKeyPlcTextTableColumns, aPartialKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);
        const oMessageDetails = new MessageDetails();
        if (aCurrentRecords.length === 0) {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': null,
                'userId': aEntryToBeUpdated[0]._CREATED_BY,
                'operationUserId': MessageOperation.DELETE,
                'objType': AdministrationObjType.TEXT_OBJ
            };
        } else {
            oMessageDetails.administrationConflictDetailsObj = {
                'newValidFromDate': aCurrentRecords[0]._VALID_FROM,
                'userId': aCurrentRecords[0]._CREATED_BY,
                'operationUserId': MessageOperation.UPDATE,
                'objType': AdministrationObjType.TEXT_OBJ
            };
        }
        const sLogMessage = `The entry was already changed by another user`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }


    var aFoundPlcRecords = await findValidEntriesInTable(sPlcTableName, aPartialKeyPlcTableColumns, aPartialKeyPlcTableColumnValues, sMasterDataDate, hQuery);
    if (aFoundPlcRecords.length === 0) {
        const sLogMessage = `There is no entry in main PLC table. You cannot create a text`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    await updateEntryWithValidToInTable(sPlcTextTableName, aKeyPlcTextTableColumns, aKeyPlcTextTableColumnValues, sMasterDataDate, hQuery);


    helper.setHQuery(hQuery);
    oResult = await insertEntryInPlcTable(sPlcTextTableName, oTextObject, sMasterDataDate, aSource[0], helper);

    return oResult;

}






this.getMasterdataTextTable = function () {

    var aAllObjects = _.keys(Resources);
    var oBusinessObject = {};
    var aUsedInBusinessObjects = [];
    _.each(aAllObjects, function (sObjectName, iIndex) {
        if (Resources[sObjectName].dbobjects.erpTextTable != '') {
            oBusinessObject = {
                'BusinessObjectName': sObjectName,
                'TableName': Resources[sObjectName].dbobjects.plcTextTable,
                'FieldsName': [['LANGUAGE']]
            };
            aUsedInBusinessObjects.push(oBusinessObject);
        }
    });
    return aUsedInBusinessObjects;
};








async function getMaintainableLanguages(sMasterDataDate, hQuery) {

    var aColumns = ['TEXTS_MAINTAINABLE'];
    var aValues = [1];
    var aMaintainableLanguages = [];

    var aAllLanguages = await findValidEntriesInTable(Resources[BusinessObjectTypes.Language].dbobjects.plcTable, aColumns, aValues, sMasterDataDate, hQuery, true);
    if (_.isArray(aAllLanguages))
        aMaintainableLanguages = _.map(aAllLanguages, 'LANGUAGE');

    return aMaintainableLanguages;
}












async function copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, helper) {

    var oCopiedObjects = {
        main: [],
        texts: []
    };

    var oWhereCondition = await createWhereConditionWithValidEntriesNotChanged(aChangedObjectsKeys, sMasterDataDate);


    var aMainUnchangedEntries = await findEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oWhereCondition, hQuery);


    var aTextUnchangedEntries = await findEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oWhereCondition, hQuery);

    if (aMainUnchangedEntries.length == 0 && aTextUnchangedEntries.length == 0)
        return oCopiedObjects;


    var iUpdatedMainEntries = await updateEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oWhereCondition, sMasterDataDate, hQuery);
    var iUpdatedTextEntries = await updateEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oWhereCondition, sMasterDataDate, hQuery);

    if (aMainUnchangedEntries.length != iUpdatedMainEntries || aTextUnchangedEntries.length != iUpdatedTextEntries) {
        const sLogMessage = `The number of updated items is not correct`;
        const oMessageDetails = new MessageDetails();
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
    }


    helper.setHQuery(hQuery);
    _.each(aMainUnchangedEntries, async function (oObject) {
        var oResult = await insertEntryInPlcTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, oObject, sMasterDataDate, aSource[0], helper);
        oCopiedObjects.main.push(oResult);
    });
    _.each(aTextUnchangedEntries, async function (oObject) {
        var oResult = await insertEntryInPlcTable(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable, oObject, sMasterDataDate, aSource[0], helper);
        oCopiedObjects.texts.push(oResult);
    });

    return oCopiedObjects;
}









async function findEntriesInTable(sTableName, oWhereCondition, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var aFoundEntries = [];

    await checkTableNameNonEmpty(sTableName);

    aStmtBuilder.push('select * from "' + sTableName + '" WHERE ');
    aStmtBuilder = aStmtBuilder.concat(oWhereCondition.conditions);
    aValues = aValues.concat(oWhereCondition.values);

    aFoundEntries = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    return aFoundEntries;

}








function createWhereConditionWithValidEntriesNotChanged(aChangedObjectsKeys, sMasterDataDate) {

    var oWhereCondition = {
        conditions: [],
        values: []
    };

    oWhereCondition.conditions.push('(');
    _.each(aChangedObjectsKeys, function (oChangedObject, iIndex) {
        var aKeys = _.keys(oChangedObject, iIndex);
        oWhereCondition.conditions.push('(');
        _.each(aKeys, function (sKey, iIdx) {
            oWhereCondition.conditions.push(sKey + ' = ? ');
            oWhereCondition.values.push(oChangedObject[sKey]);
            if (iIdx < aKeys.length - 1) {
                oWhereCondition.conditions.push(' AND ');
            }
        });
        oWhereCondition.conditions.push(')');
        if (iIndex < aChangedObjectsKeys.length - 1) {
            oWhereCondition.conditions.push(' OR ');
        }
    });
    oWhereCondition.conditions.push(')');
    oWhereCondition.conditions.push(' AND _VALID_FROM < ? AND _VALID_FROM <> ? AND _VALID_TO is NULL');
    oWhereCondition.conditions.push(' AND _SOURCE = ?');
    oWhereCondition.values.push(sMasterDataDate);
    oWhereCondition.values.push(sMasterDataDate);
    oWhereCondition.values.push(aSource[0]);
    return oWhereCondition;

}









async function updateEntriesInTable(sTableName, oWhereCondition, sMasterDataDate, hQuery) {

    var aValues = [];
    var aStmtBuilder = [];
    var iResult = 0;

    await checkTableNameNonEmpty(sTableName);

    aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? , _CREATED_BY = ?  WHERE ');
    aValues.push(sMasterDataDate);
    aValues.push($.getPlcUsername());

    aStmtBuilder = aStmtBuilder.concat(oWhereCondition.conditions);
    aValues = aValues.concat(oWhereCondition.values);

    iResult = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    return iResult;

}












async function checkNotVersionedMainRowToInsert(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl) {

    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aCompleteKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    var aMandatoryMainColumns = oConfiguration.aMandatoryMainColumns;

    var aCompleteKeyPlcTableColumnValues = await getColumnKeyValues(aCompleteKeyPlcTableColumns, oObject);


    await checkMandatoryProperties(oObject, aMandatoryMainColumns);


    var aFoundPlcRecords = await findValidEntriesInTable(sPlcTableName, aCompleteKeyPlcTableColumns, aCompleteKeyPlcTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcRecords.length !== 0) {
        const sLogMessage = `Entry already exists in PLC.`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sLogMessage, oMessageDetails);
    }

}












async function insertNotVersionedMainRow(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var oResult = await insertRowInTable(sPlcTableName, oObject, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;
}










async function checkNotVersionedTextRowToInsert(oTextObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl) {

    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var sPlcTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aTextColumns = oConfiguration.aTextColumns;
    var aCompleteKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    var aCompleteKeyPlcTableColumnValues = await getColumnKeyValues(aCompleteKeyPlcTableColumns, oTextObject);
    var aCompleteKeyPlcTextTableColumns = aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);
    var aCompleteKeyPlcTextTableColumnValues = aCompleteKeyPlcTableColumnValues.concat([oTextObject['LANGUAGE']]);

    var aMandatoryProperties = aCompleteKeyPlcTextTableColumns;
    aMandatoryProperties = _.union(aMandatoryProperties, aTextColumns);


    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    var aLanguages = await getMaintainableLanguages(sMasterDataDate, hQuery);
    if (!_.includes(aLanguages, oTextObject.LANGUAGE)) {
        const sLogMessage = `There is no language ${ oTextObject.LANGUAGE }`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        oMessageDetails.businessObj = BusinessObjectTypes.Language;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    var aFoundPlcRecords = await findValidEntriesInTable(sPlcTableName, aCompleteKeyPlcTableColumns, aCompleteKeyPlcTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcRecords.length === 0) {
        const sLogMessage = `There is no entry in main PLC table. You cannot create a text`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    var aFoundPlcTextRecords = await findValidEntriesInTable(sPlcTextTableName, aCompleteKeyPlcTextTableColumns, aCompleteKeyPlcTextTableColumnValues, sMasterDataDate, hQuery, false);
    if (aFoundPlcTextRecords.length !== 0) {
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationConflictDetailsObj = {
            'newValidFromDate': aFoundPlcTextRecords[0].LAST_MODIFIED_ON,
            'userId': aFoundPlcTextRecords[0].LAST_MODIFIED_BY,
            'operationUserId': MessageOperation.CREATE,
            'objType': AdministrationObjType.TEXT_OBJ
        };
        const sLogMessage = `The entry was already added by another user`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }

}












async function insertNotVersionedTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var oResult = await insertRowInTable(sPlcTableName, oTextObject, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;

}












function insertRowInTable(sPlcTableName, oObject, sMasterDataDate, hQuery, hQueryRepl, helper) {
    helper.setHQuery(hQuery);

    var aExcludeProperies = [];
    aExcludeProperies.push('CREATED_ON');
    aExcludeProperies.push('CREATED_BY');
    aExcludeProperies.push('LAST_MODIFIED_ON');
    aExcludeProperies.push('LAST_MODIFIED_BY');

    var oGeneratedValues = {
        'CREATED_ON': sMasterDataDate,
        'CREATED_BY': $.getPlcUsername(),
        'LAST_MODIFIED_ON': sMasterDataDate,
        'LAST_MODIFIED_BY': $.getPlcUsername()
    };

    var oSettings = {
        TABLE: sPlcTableName,
        PROPERTIES_TO_EXCLUDE: aExcludeProperies,
        GENERATED_PROPERTIES: oGeneratedValues
    };

    var oResult = helper.insertNewEntity(oObject, oSettings);

    return oResult;
}









async function checkNotVersionedMainRowToRemove(oObject, sMasterDataDate, oConfiguration, hQuery) {

    var aCompleteKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;


    var aMandatoryProperties = [];
    aMandatoryProperties = _.union(aCompleteKeyPlcTableColumns, ['LAST_MODIFIED_ON']);
    await checkMandatoryProperties(oObject, aMandatoryProperties);


    await checkNotVersionedEntryHasConflicts(oObject, sMasterDataDate, oConfiguration, hQuery, AdministrationObjType.MAIN_OBJ);


    if (oConfiguration.UsedInBusinessObjects) {
        await checkObjectIsInUse(oObject, sMasterDataDate, oConfiguration, hQuery);
    }

}









async function removeNotVersionedMainRow(oObject, sMasterDataDate, oConfiguration, hQuery) {
    var sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    var aKeyPlcValuesColumns = await getColumnKeyValues(aKeyPlcTableColumns, oObject);
    var iRemove = await removeRowsFromTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery);
    var sTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var iRemoveTexts = await removeRowsFromTable(sTextTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery);

}









async function checkNotVersionedTextRowToRemove(oTextObject, sMasterDataDate, oConfiguration, hQuery) {

    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);


    var aMandatoryProperties = [];
    aMandatoryProperties = _.union(aKeyPlcTableColumns, ['LAST_MODIFIED_ON']);
    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    await checkNotVersionedEntryHasConflicts(oTextObject, sMasterDataDate, oConfiguration, hQuery, AdministrationObjType.TEXT_OBJ);

}









async function removeNotVersionedTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery) {
    var sTextTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);
    var aKeyPlcValuesColumns = await getColumnKeyValues(aKeyPlcTableColumns, oTextObject);
    var iResult = await removeRowsFromTable(sTextTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery);
}










async function removeRowsFromTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery) {
    var aStmtBuilder = [];
    var aValues = [];
    aStmtBuilder.push('delete from "' + sTableName + '" WHERE ');
    _.each(aKeyPlcTableColumns, function (sColumnName, iIndex) {
        if (_.isString(aKeyPlcValuesColumns[iIndex])) {
            aStmtBuilder.push(' UPPER("' + sColumnName + '") = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex].toUpperCase());
        } else {
            aStmtBuilder.push(sColumnName + ' = ?');
            aValues.push(aKeyPlcValuesColumns[iIndex]);
        }
        if (iIndex < aKeyPlcTableColumns.length - 1) {
            aStmtBuilder.push(' AND ');
        }
    });
    var iResult = await hQuery.statement(aStmtBuilder.join('')).execute(aValues);

}










async function checkNotVersionedMainRowToUpdate(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl) {

    var aMandatoryMainColumns = oConfiguration.aMandatoryMainColumns;


    var aMandatoryProperties = [];
    aMandatoryProperties = _.union(aMandatoryMainColumns, ['LAST_MODIFIED_ON']);
    await checkMandatoryProperties(oObject, aMandatoryProperties);


    await checkNotVersionedEntryHasConflicts(oObject, sMasterDataDate, oConfiguration, hQuery, AdministrationObjType.MAIN_OBJ);

}












async function updateNotVersionedMainRow(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    var oResult = await updateRowInTable(sPlcTableName, oObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;
}










async function checkNotVersionedTextRowToUpdate(oTextObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl) {

    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);


    var aMandatoryProperties = [];
    aMandatoryProperties = _.union(aKeyPlcTableColumns, ['LAST_MODIFIED_ON']);
    await checkMandatoryProperties(oTextObject, aMandatoryProperties);


    await checkNotVersionedEntryHasConflicts(oTextObject, sMasterDataDate, oConfiguration, hQuery, AdministrationObjType.TEXT_OBJ);

}












async function updateNotVersionedTextRow(oTextObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, helper) {
    var sPlcTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
    var aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);
    var oResult = await updateRowInTable(sPlcTableName, oTextObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper);
    return oResult;

}













async function updateRowInTable(sPlcTableName, oObject, aKeyPlcTableColumns, sMasterDataDate, hQuery, hQueryRepl, helper) {
    var aKeyPlcValuesColumns = await getColumnKeyValues(aKeyPlcTableColumns, oObject);
    var oWhereCondition = _.zipObject(aKeyPlcTableColumns, aKeyPlcValuesColumns);

    helper.setHQuery(hQuery);

    var oUpdatedObject = _.clone(oObject);
    oUpdatedObject.LAST_MODIFIED_ON = sMasterDataDate;
    oUpdatedObject.LAST_MODIFIED_BY = $.getPlcUsername();

    var oSettings = {
        TABLE: sPlcTableName,
        WHERE_PROPERTIES: oWhereCondition
    };

    var oResult = helper.updateEntity(oUpdatedObject, oSettings);


    var oFinalResult = (await findValidEntriesInTable(sPlcTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, false))[0];

    return oFinalResult;
}










async function checkNotVersionedEntryHasConflicts(oObject, sMasterDataDate, oConfiguration, hQuery, sObjectType) {

    var sTableName = '';
    var aKeyPlcTableColumns = [];

    if (sObjectType === AdministrationObjType.TEXT_OBJ) {
        sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTextTable;
        aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns.concat(['LANGUAGE']);
    } else {
        sTableName = Resources[oConfiguration.sObjectName].dbobjects.plcTable;
        aKeyPlcTableColumns = oConfiguration.aCompleteKeyPlcTableColumns;
    }

    var aKeyPlcValuesColumns = await getColumnKeyValues(aKeyPlcTableColumns, oObject);


    var aEntryToBeMaintained = await findValidEntriesInTable(sTableName, aKeyPlcTableColumns, aKeyPlcValuesColumns, sMasterDataDate, hQuery, false);

    if (aEntryToBeMaintained.length === 0) {
        const sLogMessage = `Entry not found`;
        $.trace.error(sLogMessage);
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = sObjectType;
        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
    }


    if (aEntryToBeMaintained[0].LAST_MODIFIED_ON.getTime() != Date.parse(oObject.LAST_MODIFIED_ON)) {
        const oMessageDetails = new MessageDetails();
        oMessageDetails.administrationConflictDetailsObj = {
            'newValidFromDate': aEntryToBeMaintained[0].LAST_MODIFIED_ON,
            'userId': aEntryToBeMaintained[0].LAST_MODIFIED_BY,
            'operationUserId': MessageOperation.UPDATE,
            'objType': sObjectType
        };
        const sLogMessage = `The entry was already changed by another user.`;
        $.trace.error(sLogMessage);
        throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sLogMessage, oMessageDetails);
    }
}










this.checkObjectExists = async function (oObject, sMasterDataDate, sBusinessObjectName, hQuery) {

    if (!_.isObject(oObject)) {
        const oMessageDetails = new MessageDetails();
        const sClientMsg = 'oObject must be a valid object.';
        const sServerMsg = `${ sClientMsg } oObject: ${ JSON.stringify(oObject) }.`;
        $.trace.error(sServerMsg);
        throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
    }

    var aKeyPlcTableColumns = Resources[sBusinessObjectName].configuration.aKeyColumns;

    if (!await areAllFieldsEmpty(aKeyPlcTableColumns, oObject)) {
        var aFieldsValuesMainPlcTable = await getColumnKeyValues(aKeyPlcTableColumns, oObject);
        var aFoundPlcRecords = await findValidEntriesInTable(Resources[sBusinessObjectName].dbobjects.plcTable, aKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate, hQuery, Resources[sBusinessObjectName].configuration.IsVersioned);
        if (aFoundPlcRecords.length === 0) {
            const oMessageDetails = new MessageDetails();
            const sClientMsg = 'No such object found in masterdata table.';
            const sServerMsg = `${ sClientMsg } oObject: ${ JSON.stringify(oObject) }, table: ${ Resources[sBusinessObjectName].dbobjects.plcTable }.`;
            $.trace.error(sServerMsg);
            oMessageDetails.businessObj = sBusinessObjectName;
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
    }
};
export default {_,helpers,aSource,Resources,BusinessObjectTypes,BusinessObjectValidatorUtils,MessageLibrary,MessageDetails,PlcException,Severity,Code,ValidationInfoCode,AdministrationObjType,MessageOperation,checkTableNameNonEmpty,checkColumnAndValueLengthsAreEqual,getFilterObjectFromFilterString,createResponse,getColumnKeyValues,checkColumns,checkEntry,checkMandatoryProperties,findEntryInTable,findValidEntriesInTable,findNewerEntriesInTable,findOlderEntryInTable,getNumberOfValidEntriesInTable,updateEntryWithValidToInTable,updateEntriesWithValidToInTable,removeRow,removeTextRow,checkObjectIsInUse,insertEntryInPlcTable,insertNewEntryInPlcTable,insertTextRow,insertRow,copyDataFromErp,getPlcFields,createPlcObjectFromErpObject,areAllFieldsEmpty,updateRow,checkNotChangebleFields,updateTextRow,getMaintainableLanguages,copyUnchangedRows,findEntriesInTable,createWhereConditionWithValidEntriesNotChanged,updateEntriesInTable,checkNotVersionedMainRowToInsert,insertNotVersionedMainRow,checkNotVersionedTextRowToInsert,insertNotVersionedTextRow,insertRowInTable,checkNotVersionedMainRowToRemove,removeNotVersionedMainRow,checkNotVersionedTextRowToRemove,removeNotVersionedTextRow,removeRowsFromTable,checkNotVersionedMainRowToUpdate,updateNotVersionedMainRow,checkNotVersionedTextRowToUpdate,updateNotVersionedTextRow,updateRowInTable,checkNotVersionedEntryHasConflicts};
