const fs = $.require('fs');
const path = $.require('path');
const appRoot = $.require('../../../util/approot').getAppRoot(); // workaround: appRoot global variable is not accessible in xsjslib
var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;
var Resources = $.require('../../../util/masterdataResources').MasterdataResource;
var MasterdataReadProcedures = $.require('../../../util/masterdataResources').MasterdataReadProcedures;
var Limits = $.require('../../../util/masterdataResources').Limits;
var Helper = $.require('../../persistency-helper').Helper;
var Metadata = $.require('../../persistency-metadata').Metadata;
var UrlToSqlConverter = $.require('../../../util/urlToSqlConverter').UrlToSqlConverter;
var MessageLibrary = $.require('../../../util/message');
var MessageOperation = MessageLibrary.Operation;
var PlcException = MessageLibrary.PlcException;
var MessageCode = MessageLibrary.Code;
var MessageDetails = MessageLibrary.Details;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;
var Severity = MessageLibrary.Severity;
var AdministrationObjType = MessageLibrary.AdministrationObjType;
var Operation = MessageLibrary.Operation;
var BatchOperation = $.require('../../../util/masterdataResources').BatchOperation;
var BusinessObjectValidatorUtils = $.require('../../../validator/businessObjectValidatorUtils').BusinessObjectValidatorUtils;
var TemplateEngine = $.require('../../generation/template-engine').TemplateEngine;
var oTemplateEngine = new TemplateEngine();

var aAuditFieldsForVersionedEntries = [
    '_VALID_FROM',
    '_VALID_TO',
    '_SOURCE',
    '_CREATED_BY'
];
var aErrorFieldsInTemporaryTables = [
    'OPERATION',
    'ERROR_CODE',
    'ERROR_DETAILS',
    'ORIGINAL_ENTRY'
];


/**
   Base Class for Masterdata Objects
 */
function MasterDataBaseObject(dbConnection, hQuery, sObjectName, sIgnoreBadData) {

    this.helper = new Helper($, hQuery, dbConnection);
    this.metadata = new Metadata($, hQuery, null, $.getPlcUsername());
    this.aMetadataFields = getMetadataForAllFields(this.metadata, sObjectName);
    this.oMessageDetails = new MessageDetails();
    this.converter = new UrlToSqlConverter();
    this.validationTemplates = [];
    this.validationTemplatesPackageName = 'xs.db.administration.templates.validation';
    this.processingTemplates = [];
    this.processingTemplatesPackageName = 'xs.db.administration.templates.process';
    this.context = {};
    this.currentMainOperations = [];
    this.currentTextOperations = [];
    this.ignoreBadData = sIgnoreBadData;
    var that = this;

    /**
	 * Get data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {object} oGetParameters - object with parameters (determined from URL)
	 * @param   {string} sLanguage      - language (taken from Session)
	 * @returns {object} oReturnObject  - object containing the main entities, referenced entities and texts
	 */
    MasterDataBaseObject.prototype.get = async function (oGetParameters, sLanguage, sMasterDataDate) {

        var oReturnObject = {};
        var oDeterminedParameters = {
            sLanguage: sLanguage,
            sMasterDataDate: sMasterDataDate,
            sAutocompleteText: '',
            bAutocompleteIsNullOrUndefined: true,
            sSqlFilter: '',
            sUrlFilter: '',
            iTopRecords: Limits.Top,
            iSkipRecords: 0
        };

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            oDeterminedParameters.sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            oDeterminedParameters.sAutocompleteText = oGetParameters.searchAutocomplete;
            oDeterminedParameters.bAutocompleteIsNullOrUndefined = false;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            oDeterminedParameters.sSqlFilter = this.converter.convertToSqlFormat(oGetParameters.filter, this.aMetadataFields);
            oDeterminedParameters.sUrlFilter = oGetParameters.filter;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.top)) {
            oDeterminedParameters.iTopRecords = parseInt(oGetParameters.top);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.skip)) {
            oDeterminedParameters.iSkipRecords = parseInt(oGetParameters.skip);
        }

        try {
            var fnProcedure = dbConnection.loadProcedure(MasterdataReadProcedures[sObjectName]);
            oReturnObject = this.getDataUsingSqlProcedure(fnProcedure, oDeterminedParameters);
        } catch (e) {
            const sLogMessage = `Error when procedure ${ MasterdataReadProcedures[sObjectName] } is called.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, this.oMessageDetails);
        }
        return oReturnObject;

    };

    /**
	 * Get data using sql procedure
	 *
	 * @param   {object} fnProcedure  - procedure used on get
	 * @param   {object} oProcedureParameters  - object with parameters - used to store parameters that will be sent to the procedures
	 * @returns {object} oReturnObject         - object containing the main entities, referenced entities and texts
	 */
    MasterDataBaseObject.prototype.getDataUsingSqlProcedure = function (fnProcedure, oProcedureParameters) {
        return {};
    };

    /**
	 * Determine all operations that are done by the user inside the batch request
	 * 
	 * @param   {object} oBatchItems - object that comes from the request containing all items that should be created/updated/deleted/upserted
     */
    MasterDataBaseObject.prototype.determineCurrentOperations = async function (oBatchItems) {

        this.currentMainOperations = [];
        this.currentTextOperations = [];

        if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.CREATE, AdministrationObjType.MAIN_OBJ))
            this.currentMainOperations.push(Operation.CREATE);
        if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.UPDATE, AdministrationObjType.MAIN_OBJ))
            this.currentMainOperations.push(Operation.UPDATE);
        if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.DELETE, AdministrationObjType.MAIN_OBJ))
            this.currentMainOperations.push(Operation.DELETE);
        if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.UPSERT, AdministrationObjType.MAIN_OBJ))
            this.currentMainOperations.push(Operation.UPSERT);

        if (await hasBusinessObjectText(sObjectName)) {
            if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.CREATE, AdministrationObjType.TEXT_OBJ))
                this.currentTextOperations.push(Operation.CREATE);
            if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.UPDATE, AdministrationObjType.TEXT_OBJ))
                this.currentTextOperations.push(Operation.UPDATE);
            if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.DELETE, AdministrationObjType.TEXT_OBJ))
                this.currentTextOperations.push(Operation.DELETE);
            if (await isOperationRequested(oBatchItems, sObjectName, BatchOperation.UPSERT, AdministrationObjType.TEXT_OBJ))
                this.currentTextOperations.push(Operation.UPSERT);
        }

        if (sObjectName === BusinessObjectTypes.WorkCenter) {
            this.currentProcessOperations = this.determineOtherOperations(oBatchItems, Resources[sObjectName].configuration.WorkCenterProcessSection);
            this.currentActivityOperations = this.determineOtherOperations(oBatchItems, Resources[sObjectName].configuration.WorkCenterActivitySection);
        }
    };


    /**
	 * Add the templates used for validation in an array, in order to process them in a defined order
	 */
    MasterDataBaseObject.prototype.registerValidationTemplates = function () {

        // validation scripts for main entities
        if (_.includes(this.currentMainOperations, Operation.CREATE)) {
            this.validationTemplates.push('mainCheckDuplicateVersionedEntries.template');
        }
        if (_.includes(this.currentMainOperations, Operation.UPDATE) || _.includes(this.currentMainOperations, Operation.DELETE)) {
            this.validationTemplates.push('mainCheckVersionedEntriesExist.template');
            this.validationTemplates.push('mainCheckVersionedEntriesWithSourcePlc.template');
            if (_.includes(this.currentMainOperations, Operation.UPDATE)) {
                this.validationTemplates.push('mainCheckReadOnlyFields.template');
            }
            this.validationTemplates.push('mainCheckVersionedEntriesNotCurrent.template');
        }
        if (_.includes(this.currentMainOperations, Operation.UPSERT)) {
            this.validationTemplates.push('mainCheckVersionedEntriesForUpsertWithSourcePlc.template');
        }
        if (_.includes(this.currentMainOperations, Operation.CREATE) || _.includes(this.currentMainOperations, Operation.UPDATE) || _.includes(this.currentMainOperations, Operation.UPSERT)) {
            this.validationTemplates.push('mainCheckReferencedObjects.template');
        }
        if (_.includes(this.currentMainOperations, Operation.DELETE)) {
            this.validationTemplates.push('mainCheckUsedInBusinessObjects.template');
        }
        // validation scripts for text entities
        if (_.includes(this.currentTextOperations, Operation.CREATE) || _.includes(this.currentTextOperations, Operation.UPSERT)) {
            this.validationTemplates.push('textCheckLanguage.template');
        }
        if (_.includes(this.currentTextOperations, Operation.UPSERT)) {
            this.validationTemplates.push('textCheckMainVersionedEntriesExistsWhenUpsert.template');
            this.validationTemplates.push('textCheckVersionedEntriesForUpsertWithSourcePlc.template');
        }
        if (_.includes(this.currentTextOperations, Operation.CREATE)) {
            this.validationTemplates.push('textCheckMainVersionedEntriesExists.template');
            this.validationTemplates.push('textCheckDuplicateVersionedEntries.template');
        }
        if (_.includes(this.currentTextOperations, Operation.UPDATE) || _.includes(this.currentTextOperations, Operation.DELETE)) {
            this.validationTemplates.push('textCheckVersionedEntriesExist.template');
            this.validationTemplates.push('textCheckVersionedEntriesWithSourcePlc.template');
            this.validationTemplates.push('textCheckVersionedEntriesNotCurrent.template');
        }

    };

    /**
	 * Add the templates used for processing in an array, in order to process them in a defined order
	 */
    MasterDataBaseObject.prototype.registerProcessTemplates = async function () {

        // processing scripts for main entities
        if (_.includes(this.currentMainOperations, Operation.UPDATE) || _.includes(this.currentMainOperations, Operation.DELETE)) {
            this.processingTemplates.push('mainUpdateVersionedEntries.template');
        }

        if (_.includes(this.currentMainOperations, Operation.UPSERT)) {
            this.processingTemplates.push('mainUpdateCurrentVersionedEntries.template');
        }

        if (_.includes(this.currentMainOperations, Operation.CREATE) || _.includes(this.currentMainOperations, Operation.UPDATE) || _.includes(this.currentMainOperations, Operation.UPSERT)) {
            this.processingTemplates.push('mainInsertVersionedEntries.template');
            this.processingTemplates.push('customInsertVersionedEntries.template');
        }

        // processing scripts for text entities
        if (_.includes(this.currentTextOperations, Operation.UPDATE) || _.includes(this.currentTextOperations, Operation.DELETE)) {
            this.processingTemplates.push('textUpdateVersionedEntries.template');
        }

        if (_.includes(this.currentMainOperations, Operation.DELETE) && await hasBusinessObjectText(sObjectName)) {
            this.processingTemplates.push('textUpdateAllVersionedEntriesOnDelete.template');
        }

        if (_.includes(this.currentTextOperations, Operation.UPSERT)) {
            this.processingTemplates.push('textUpdateCurrentVersionedEntries.template');
        }

        if (_.includes(this.currentTextOperations, Operation.CREATE) || _.includes(this.currentTextOperations, Operation.UPDATE) || _.includes(this.currentTextOperations, Operation.UPSERT)) {
            this.processingTemplates.push('textInsertVersionedEntries.template');
        }

    };

    /**
	 * Prepare the context. The context contains different information about the business object and will be used in order to fill the placeholders used in templates.
	 */
    MasterDataBaseObject.prototype.prepareContext = async function () {
        this.context.MasterdataBusinessObject = {
            temporaryTableName: Resources[sObjectName].dbobjects.tempTable,
            temporaryTextTableName: Resources[sObjectName].dbobjects.tempTextTable,
            mainTableName: Resources[sObjectName].dbobjects.plcTable,
            extTableName: Resources[sObjectName].dbobjects.plcTable + '_ext',
            textTableName: Resources[sObjectName].dbobjects.plcTextTable,
            keyFields: Resources[sObjectName].configuration.aKeyColumns,
            fieldsReadOnly: await fillFieldsReadOnlyContextProperty(Resources[sObjectName].configuration.aReadOnlyColumns),
            currentTimestamp: new Date(),
            currentUser: $.getPlcUsername(),
            fieldsMain: _.difference(this.helper.getColumnsForTable(Resources[sObjectName].dbobjects.plcTable), aAuditFieldsForVersionedEntries),
            fieldsText: _.union(Resources[sObjectName].configuration.aKeyColumns, Resources[sObjectName].configuration.aTextColumns, ['LANGUAGE']),
            fieldsCustom: fillFieldsCustomContextProperty(this.aMetadataFields),
            usedInBusinessObjects: await fillUsedInBusinessObjectsContextProperty(Resources[sObjectName].configuration.UsedInBusinessObjects),
            referencedObjects: await fillReferencedObjectsContextProperty(Resources[sObjectName].configuration.ReferencedObjects),
            ignoreBadData: this.ignoreBadData
        };
    };

    /**
	 * Fill fieldsReadOnly context property
	 * 
	 * @param   {array} aReadOnlyColumns - array of readonly columns for an object
	 */
    async function fillFieldsReadOnlyContextProperty(aReadOnlyColumns) {
        var aFieldsReadOnlyProperty = [];

        if (helpers.isNullOrUndefined(aReadOnlyColumns))
            return aFieldsReadOnlyProperty;

        return aReadOnlyColumns;
    }

    /**
	 * Fill usedInBusinessObjects context property
	 * 
	 * @param   {array} aUsedInBusinessObjects - array of objects in which the current business object is referenced
	 */
    async function fillUsedInBusinessObjectsContextProperty(aUsedInBusinessObjects) {
        var aUsedInBusinessObjectsProperty = [];

        if (helpers.isNullOrUndefined(aUsedInBusinessObjects))
            return aUsedInBusinessObjectsProperty;

        _.each(aUsedInBusinessObjects, async function (oBusinessObject) {
            var oUsedInBusinessObjects = {};
            oUsedInBusinessObjects.BusinessObjectName = oBusinessObject.BusinessObjectName;
            oUsedInBusinessObjects.FieldsName = oBusinessObject.FieldsName;
            if (helpers.isNullOrUndefined(oBusinessObject.TableName))
                oUsedInBusinessObjects.TableName = Resources[oBusinessObject.BusinessObjectName].dbobjects.plcTable;
            else
                oUsedInBusinessObjects.TableName = oBusinessObject.TableName;
            if (helpers.isNullOrUndefined(oBusinessObject.IsVersioned))
                oUsedInBusinessObjects.IsVersioned = true;
            else
                oUsedInBusinessObjects.IsVersioned = oBusinessObject.IsVersioned;
            aUsedInBusinessObjectsProperty.push(oUsedInBusinessObjects);
        });

        return aUsedInBusinessObjectsProperty;
    }

    /**
	 * Fill referencedObjects context property
	 * 
	 * @param   {array} aReferencedObjects - array of referenced objects which are in the current business object
	 */
    async function fillReferencedObjectsContextProperty(aReferencedObjects) {
        var aReferencedObjectsProperty = [];

        if (helpers.isNullOrUndefined(aReferencedObjects))
            return aReferencedObjectsProperty;

        _.each(aReferencedObjects, async function (oBusinessObject) {
            var oRefObj = {};
            oRefObj.RefBusinessObjectName = oBusinessObject.BusinessObjectName;
            oRefObj.FieldsNameForMainObj = oBusinessObject.FieldsName;
            if (helpers.isNullOrUndefined(oBusinessObject.TableName)) {
                oRefObj.TableName = Resources[oBusinessObject.BusinessObjectName].dbobjects.plcTable;
                oRefObj.FieldsNameForRefObj = Resources[oBusinessObject.BusinessObjectName].configuration.aKeyColumns;
            } else {
                oRefObj.TableName = oBusinessObject.TableName;
                oRefObj.FieldsNameForRefObj = oBusinessObject.FieldsName[0];
            }
            if (helpers.isNullOrUndefined(oBusinessObject.IsVersioned))
                oRefObj.IsVersioned = true;
            else
                oRefObj.IsVersioned = oBusinessObject.IsVersioned;
            aReferencedObjectsProperty.push(oRefObj);
        });

        return aReferencedObjectsProperty;
    }

    /**
	 * Get all custom fields names (metadata already contains the custom fields with sufixes: _MANUAL, _UNIT) 
	 * 
	 *  params {array} aMetadataFields  - array with all metadata fields (including custom fields)
	 *  @returns {array} aCustomFields  - array with all custom fields names
	 */
    function fillFieldsCustomContextProperty(aMetadataFields) {
        var aCustomFields = _.filter(aMetadataFields, function (oMetadataField) {
            return oMetadataField.IS_CUSTOM === 1;
        });
        return _.map(aCustomFields, 'COLUMN_ID');
    }

    /**
	 * Add specific validations
	 */
    MasterDataBaseObject.prototype.validateBefore = function () {
		//to be redefined in the objects that will inherit this base object, if needed
	    };

    /**
	 * Add specific validations
	 */
    MasterDataBaseObject.prototype.validateAfter = function () {
		//to be redefined in the objects that will inherit this base object, if needed
	    };

    /**
	 * Add specific processing
	 */
    MasterDataBaseObject.prototype.processBefore = function () {
		//to be redefined in the objects that will inherit this base object, if needed
	    };

    /**
	 * Add specific response
	 */
    MasterDataBaseObject.prototype.determineOtherOperations = function () {
		//to be redefined in the objects that will inherit this base object, if needed
	    };

    /**
	 * Add specific processing
	 */
    MasterDataBaseObject.prototype.processAfter = function () {
		//to be redefined in the objects that will inherit this base object, if needed
	    };

    /**
	 * General logic in order to validate the data
	 * 
	 * @param   {object} oBatchItems - object that comes from the request containing all items that should be created/updated/deleted/upserted
	 */
    MasterDataBaseObject.prototype.validate = async function (oBatchItems, sMasterDataDate) {

        this.determineCurrentOperations(oBatchItems);
        this.registerValidationTemplates();
        this.prepareContext();
        await deleteTemporaryTableContent(sObjectName);





        _.each(oBatchItems, async function (value, key) {
            var sOperation = '';
            if (key === BatchOperation.CREATE) {
                sOperation = Operation.CREATE;
            } else if (key === BatchOperation.UPDATE) {
                sOperation = Operation.UPDATE;
            } else if (key === BatchOperation.DELETE) {
                sOperation = Operation.DELETE;
            } else if (key === BatchOperation.UPSERT) {
                sOperation = Operation.UPSERT;
            }
            if (_.includes(that.currentMainOperations, sOperation))
                checkAndInsertIntoTemporaryTable(oBatchItems[key], sOperation, AdministrationObjType.MAIN_OBJ, that.context);
            if (_.includes(that.currentTextOperations, sOperation))
                checkAndInsertIntoTemporaryTable(oBatchItems[key], sOperation, AdministrationObjType.TEXT_OBJ, that.context);
        });

        this.validateBefore();


        _.each(this.validationTemplates, async function (sValidationTemplate, iIndex) {
            generateAndExecuteSql(that.validationTemplatesPackageName, sValidationTemplate, that.context);
        });

        this.validateAfter(oBatchItems);


        var oResultObject = {
            entities: {},
            hasErrors: false,
            errors: []
        };
        await createResponseWithErrors(oResultObject, sObjectName, AdministrationObjType.MAIN_OBJ);
        if (await hasBusinessObjectText(sObjectName)) {
            await createResponseWithErrors(oResultObject, sObjectName, AdministrationObjType.TEXT_OBJ);
        }
        if (sObjectName === BusinessObjectTypes.WorkCenter) {
            if (!helpers.isNullOrUndefined(this.currentProcessOperations)) {
                await createResponseWithErrors(oResultObject, BusinessObjectTypes.WorkCenterProcess, AdministrationObjType.MAIN_OBJ);
            }
            if (!helpers.isNullOrUndefined(this.currentActivityOperations)) {
                await createResponseWithErrors(oResultObject, BusinessObjectTypes.WorkCenterActivity, AdministrationObjType.MAIN_OBJ);
            }
        }
        return oResultObject;
    };




    MasterDataBaseObject.prototype.process = async function () {

        this.registerProcessTemplates();
        if (this.context === {}) {
            var oMessageDetails = new MessageDetails();
            const sLogMessage = `The context is empty. The validation should be done before processing.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        this.processBefore();

        _.each(this.processingTemplates, async function (sProcessingTemplate, iIndex) {
            generateAndExecuteSql(that.processingTemplatesPackageName, sProcessingTemplate, that.context);
        });
        this.processAfter();

        var oResultObject = {
            CREATE: {},
            UPSERT: {},
            UPDATE: {},
            DELETE: {}
        };

        await createResponseAfterProcessingEntries(oResultObject, sObjectName, AdministrationObjType.MAIN_OBJ, this.context.MasterdataBusinessObject.currentTimestamp, this.currentMainOperations, this.context.MasterdataBusinessObject.fieldsCustom);
        if (await hasBusinessObjectText(sObjectName)) {
            await createResponseAfterProcessingEntries(oResultObject, sObjectName, AdministrationObjType.TEXT_OBJ, this.context.MasterdataBusinessObject.currentTimestamp, this.currentTextOperations, []);
        }
        if (sObjectName === BusinessObjectTypes.WorkCenter) {
            if (!helpers.isNullOrUndefined(this.currentProcessOperations)) {
                await createResponseAfterProcessingEntries(oResultObject, BusinessObjectTypes.WorkCenterProcess, AdministrationObjType.MAIN_OBJ, this.context.MasterdataBusinessObject.currentTimestamp, this.currentProcessOperations, []);
            }
            if (!helpers.isNullOrUndefined(this.currentActivityOperations)) {
                await createResponseAfterProcessingEntries(oResultObject, BusinessObjectTypes.WorkCenterActivity, AdministrationObjType.MAIN_OBJ, this.context.MasterdataBusinessObject.currentTimestamp, this.currentActivityOperations, []);
            }
        }
        return oResultObject;
    };









    MasterDataBaseObject.prototype.initializeColumns = function (oRecord, sOperation, sObjectType) {
		
	    };







    async function generateAndExecuteSql(packageName, templateName, oContext) {
        var sql;
        const templatePath = path.resolve(appRoot, 'lib', packageName.replace(/\./g, '/'), templateName);
        const sTemplate = fs.readFileSync(templatePath, { encoding: 'utf8' });
        sql = oTemplateEngine.compile(sTemplate, oContext);
        if (sql != '') {
            await dbConnection.executeUpdate(sql);
        }
    }









    async function checkAndInsertIntoTemporaryTable(oBatchItems, sOperation, sObjectType, oContext) {
        var aBatchItems;
        var sTempTableName;
        var aTableColumns;
        if (sObjectType === AdministrationObjType.MAIN_OBJ) {
            aBatchItems = oBatchItems[Resources[sObjectName].configuration.MainEntitiesSection];
            sTempTableName = Resources[sObjectName].dbobjects.tempTable;
            aTableColumns = _.union(oContext.MasterdataBusinessObject.fieldsMain, oContext.MasterdataBusinessObject.fieldsCustom, aAuditFieldsForVersionedEntries, aErrorFieldsInTemporaryTables);
        } else if (sObjectType === AdministrationObjType.TEXT_OBJ) {
            aBatchItems = oBatchItems[Resources[sObjectName].configuration.TextEntitiesSection];
            sTempTableName = Resources[sObjectName].dbobjects.tempTextTable;
            aTableColumns = _.union(oContext.MasterdataBusinessObject.fieldsText, aAuditFieldsForVersionedEntries, aErrorFieldsInTemporaryTables);
        }


        var aStmtBuilder = [`insert into "${ sTempTableName }"`];
        aStmtBuilder.push('(' + aTableColumns.join(',') + ')');
        var aValuePlaceHolder = _.map(aTableColumns, function () {
            return '?';
        });
        aStmtBuilder.push('VALUES (' + aValuePlaceHolder.join(',') + ')');
        var aInsertValues = [];

        _.each(aBatchItems, async function (oRecord) {
            var oEntry = {};
            try {
                await checkColumnsUsingMetadata(oRecord, that.aMetadataFields, sOperation, sObjectType);
                that.initializeColumns(oRecord, sOperation, sObjectType);
                await that.checkMandatoryProperties(oRecord, sOperation, sObjectType);
                oEntry = oRecord;
                oEntry.OPERATION = sOperation;
                oEntry.ERROR_CODE = '';
                oEntry.ERROR_DETAILS = '';
                oEntry.ORIGINAL_ENTRY = '';
            } catch (e) {
                oEntry.OPERATION = sOperation;
                oEntry.ERROR_CODE = e.code.code;
                if (!helpers.isNullOrUndefined(e.details)) {
                    oEntry.ERROR_DETAILS = JSON.stringify(_.omit(e.details, 'messageTextObj'));
                }
                oEntry.ORIGINAL_ENTRY = JSON.stringify(oRecord);
            }
            var aItemValues = [];
            _.each(aTableColumns, function (sColumnName) {
                if (_.has(oEntry, sColumnName)) {
                    aItemValues.push(oEntry[sColumnName]);
                } else {
                    aItemValues.push(null);
                }
            });
            aInsertValues.push(aItemValues);
        });

        var sStmt = aStmtBuilder.join(' ');
         await dbConnection.executeUpdate(sStmt, aInsertValues);
    }






    async function deleteTemporaryTableContent(sObjectName) {

        var sStmt = 'DELETE FROM "' + Resources[sObjectName].dbobjects.tempTable + '"';
        await dbConnection.executeUpdate(sStmt);

        if (await hasBusinessObjectText(sObjectName)) {
            sStmt = 'DELETE FROM "' + Resources[sObjectName].dbobjects.tempTextTable + '"';
            await dbConnection.executeUpdate(sStmt);
        }
    }











    async function checkColumnsUsingMetadata(oEntry, aMetadataFields, sOperation, sObjectType) {

        if (!_.isObject(oEntry)) {
            var oMsgDetails = new MessageDetails();
            oMsgDetails.validationObj = { 'validationInfoCode': ValidationInfoCode.SYNTACTIC_ERROR };

            const sClientMsg = 'Error in checkColumnsUsingMetadata: oEntry must be a valid object.';
            const sServerMsg = `${ sClientMsg } oEntry: ${ JSON.stringify(oEntry) }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg, oMsgDetails);
        }

        var aColumns = _.keys(oEntry);
        var aValues = _.values(oEntry);
        var oValidationUtils = new BusinessObjectValidatorUtils();
        _.each(aColumns, function (oColumns, iColIndex) {
            oValidationUtils.checkColumn(aMetadataFields, aColumns[iColIndex], aValues[iColIndex]);
        });
    }








    MasterDataBaseObject.prototype.checkMandatoryProperties = async function (oEntry, sOperation, sObjectType) {

        var aMandatoryProperties = Resources[sObjectName].configuration.aKeyColumns;
        if ((sOperation === Operation.UPDATE || sOperation === Operation.DELETE) && Resources[sObjectName].configuration.IsVersioned) {
            aMandatoryProperties = _.union(aMandatoryProperties, ['_VALID_FROM']);
        }
        if ((sOperation === Operation.CREATE || sOperation === Operation.UPDATE || sOperation === Operation.UPSERT) && sObjectType === AdministrationObjType.MAIN_OBJ && !helpers.isNullOrUndefined(Resources[sObjectName].configuration.aOtherMandatoryColumns)) {
            aMandatoryProperties = _.union(aMandatoryProperties, Resources[sObjectName].configuration.aOtherMandatoryColumns);
        }
        if (sObjectType === AdministrationObjType.TEXT_OBJ) {
            if (sOperation === Operation.CREATE && _.isArray(Resources[sObjectName].configuration.aTextColumns)) {
                aMandatoryProperties = _.union(aMandatoryProperties, Resources[sObjectName].configuration.aTextColumns);
            }
            aMandatoryProperties = _.union(aMandatoryProperties, ['LANGUAGE']);
        }

        that.checkMandatoryNotNullProperties(oEntry, aMandatoryProperties);
    };

    MasterDataBaseObject.prototype.checkMandatoryNotNullProperties = function (oEntry, aMandatoryProperties, aObjMissingProperties) {
        aObjMissingProperties = aObjMissingProperties || [];
        let aObjNullMandatoryProperties = [];

        aMandatoryProperties.forEach(sMandatoryProperty => {
            if (!_.has(oEntry, sMandatoryProperty)) {
                aObjMissingProperties.push(_.zipObject(['columnId'], [sMandatoryProperty]));
            } else if (oEntry[sMandatoryProperty] === '' || oEntry[sMandatoryProperty] === null) {
                aObjNullMandatoryProperties.push(_.zipObject(['columnId'], [sMandatoryProperty]));
            }
        });

        if (aObjMissingProperties.length !== 0 || aObjNullMandatoryProperties.length !== 0) {
            let sLogMessage;
            let oMsgDetails = new MessageDetails();

            if (aObjMissingProperties.length !== 0) {
                sLogMessage = `Please enter mandatory properties: ${ _.map(aObjMissingProperties, 'columnId').join(', ') }`;
                oMsgDetails.validationObj = {
                    'columnIds': aObjMissingProperties,
                    'validationInfoCode': ValidationInfoCode.MISSING_MANDATORY_ENTRY
                };
            } else {
                sLogMessage = `Null or empty is not allowed for: ${ _.map(aObjNullMandatoryProperties, 'columnId').join(', ') }`;
                oMsgDetails.validationObj = {
                    'columnIds': aObjNullMandatoryProperties,
                    'validationInfoCode': ValidationInfoCode.VALUE_ERROR
                };
            }
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sLogMessage, oMsgDetails);
        }
    };










    async function createResponseAfterProcessingEntries(oResultObject, sObjectName, sObjectType, sMasterDataDate, aOperations, aCustomFields) {

        var sTempTable;
        var sSection;
        var sPlcTable;
        var aKeys;

        if (sObjectType === AdministrationObjType.MAIN_OBJ) {
            sTempTable = Resources[sObjectName].dbobjects.tempTable;
            sSection = Resources[sObjectName].configuration.MainEntitiesSection;
            sPlcTable = Resources[sObjectName].dbobjects.plcTable;
            aKeys = Resources[sObjectName].configuration.aKeyColumns;
        } else if (sObjectType === AdministrationObjType.TEXT_OBJ) {
            sTempTable = Resources[sObjectName].dbobjects.tempTextTable;
            sSection = Resources[sObjectName].configuration.TextEntitiesSection;
            sPlcTable = Resources[sObjectName].dbobjects.plcTextTable;
            aKeys = _.union(Resources[sObjectName].configuration.aKeyColumns, ['LANGUAGE']);
        }

        if (_.includes(aOperations, Operation.CREATE)) {
            oResultObject[BatchOperation.CREATE][sSection] = await selectCreatedUpdatedDeletedEntries(sPlcTable, sTempTable, aKeys, Operation.CREATE, sMasterDataDate, aCustomFields);
        }
        if (_.includes(aOperations, Operation.UPSERT)) {
            oResultObject[BatchOperation.UPSERT][sSection] = await selectCreatedUpdatedDeletedEntries(sPlcTable, sTempTable, aKeys, Operation.UPSERT, sMasterDataDate, aCustomFields);
        }
        if (_.includes(aOperations, Operation.UPDATE)) {
            oResultObject[BatchOperation.UPDATE][sSection] = await selectCreatedUpdatedDeletedEntries(sPlcTable, sTempTable, aKeys, Operation.UPDATE, sMasterDataDate, aCustomFields);
        }
        if (_.includes(aOperations, Operation.DELETE)) {
            oResultObject[BatchOperation.DELETE][sSection] = await selectCreatedUpdatedDeletedEntries(sPlcTable, sTempTable, aKeys, Operation.DELETE, sMasterDataDate, aCustomFields);
        }

    }











    async function selectCreatedUpdatedDeletedEntries(sPlcTable, sTempTable, aKeys, sOperation, sMasterDataDate, aCustomFields) {

        var aStmtBuilder = [];
        var aMaintainedEntries = [];

        if (sPlcTable === '' || sTempTable === '') {
            const sLogMessage = `Table name is not specified.`;
            var oMessageDetails = new MessageDetails();
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        aStmtBuilder.push(' select main.* ');
        if (aCustomFields.length > 0) {
            _.each(aCustomFields, function (sColumnName, iIndex) {
                aStmtBuilder.push(', ext.' + sColumnName);
            });
        }

        aStmtBuilder.push(' from "' + sPlcTable + '" as main');
        aStmtBuilder.push(' inner join "' + sTempTable + '" as temp on ');

        var sKeyCondTemp = _.map(aKeys, function (sColumnName) {
            return ' main.' + sColumnName + ' = temp.' + sColumnName;
        }).join(' AND ');
        aStmtBuilder.push(sKeyCondTemp);

        if (sOperation === Operation.DELETE) {
            aStmtBuilder.push(' AND main._VALID_FROM = temp._VALID_FROM');
        } else {
            aStmtBuilder.push(' AND main._VALID_FROM <= TO_TIMESTAMP(?) AND main._VALID_TO is null ');
        }

        if (aCustomFields.length > 0) {
            aStmtBuilder.push(' left outer join "' + sPlcTable + '_ext" as ext on ');
            var sKeyCondCust = _.map(aKeys, function (sColumnName) {
                return ' main.' + sColumnName + ' = ext.' + sColumnName;
            }).join(' AND ');
            aStmtBuilder.push(sKeyCondCust);

            aStmtBuilder.push(' AND main._VALID_FROM = ext._VALID_FROM');
        }

        aStmtBuilder.push(' WHERE temp.ERROR_CODE = ? and temp.OPERATION = ?');

        var sStmt = aStmtBuilder.join(' ');
        if (sOperation === Operation.DELETE) {
            aMaintainedEntries = await dbConnection.executeQuery(sStmt, '', sOperation);
        } else {
            aMaintainedEntries = await dbConnection.executeQuery(sStmt, sMasterDataDate, '', sOperation);
        }

        return Array.slice(aMaintainedEntries);
    }








    async function createResponseWithErrors(oResultObject, sObjectName, sObjectType) {

        var sTempTable;
        var sSection;

        if (sObjectType === AdministrationObjType.MAIN_OBJ) {
            sTempTable = Resources[sObjectName].dbobjects.tempTable;
            sSection = Resources[sObjectName].configuration.MainEntitiesSection;
        } else if (sObjectType === AdministrationObjType.TEXT_OBJ) {
            sTempTable = Resources[sObjectName].dbobjects.tempTextTable;
            sSection = Resources[sObjectName].configuration.TextEntitiesSection;
        }

        var sSelectStatement = 'select * from "' + sTempTable + "\" where ERROR_CODE <> ''";
        var aErrorEntries = await dbConnection.executeQuery(sSelectStatement);

        _.each(aErrorEntries, async function (oErrorEntry, iIndex) {
            var oResult = {};
            var aEntity = [];
            var entitySection = {};
            var oMessageDetails = new MessageDetails();
            oResult.code = oErrorEntry.ERROR_CODE;
            oResult.severity = Severity.ERROR;
            oResult.operation = oErrorEntry.OPERATION;

            if (oErrorEntry.ORIGINAL_ENTRY === '') {
                aEntity.push(_.omit(oErrorEntry, aErrorFieldsInTemporaryTables));
            } else {
                try {
                    aEntity.push(JSON.parse(oErrorEntry.ORIGINAL_ENTRY));
                } catch (e) {
                    const sLogMessage = `Error in ORIGINAL_ENTRY, when parsing. Unexpected error occurred: ${ e.message } - stack: ${ e.stack }.`;
                    $.trace.error(sLogMessage);
                }
            }

            if (oErrorEntry.ERROR_DETAILS !== '') {
                await setErrorDetails(oMessageDetails, oErrorEntry.ERROR_DETAILS);
            }

            entitySection[sSection] = aEntity;
            oMessageDetails.administrationObj = entitySection;
            oResult.details = oMessageDetails;
            oResultObject.errors.push(oResult);
            oResultObject.hasErrors = true;
        });



        if (!_.isEmpty(aErrorEntries)) {
            const sLogMessage = `Errors occurred during the maintenance of ${ sObjectName }. Please check the response for more details.`;
            $.trace.error(sLogMessage);
        }
    }







    async function setErrorDetails(oMessageDetails, oErrorDetails) {
        try {
            var errorObject = JSON.parse(oErrorDetails);
            _.extend(oMessageDetails, _.omit(errorObject, 'messageTextObj'));
        } catch (e) {
            const sLogMessage = `Error in setErrorDetails, when parsing. Unexpected error occurred: ${ e.message } - stack: ${ e.stack }`;
            $.trace.error(sLogMessage);
        }
        return oMessageDetails;
    }






    async function hasBusinessObjectText(sObjectName) {
        if (!helpers.isNullOrUndefined(Resources[sObjectName].configuration.TextEntitiesSection) && Resources[sObjectName].configuration.TextEntitiesSection != '')
            return true;
        return false;
    }









    async function isOperationRequested(oBatchItems, sObjectName, sOperation, sObjectType) {

        var sSection;
        if (sObjectType === AdministrationObjType.MAIN_OBJ) {
            sSection = Resources[sObjectName].configuration.MainEntitiesSection;
        } else if (sObjectType === AdministrationObjType.TEXT_OBJ) {
            sSection = Resources[sObjectName].configuration.TextEntitiesSection;
        }

        if (!helpers.isNullOrUndefined(oBatchItems[sOperation]) && !helpers.isNullOrUndefined(oBatchItems[sOperation][sSection]) && oBatchItems[sOperation][sSection].length > 0)
            return true;

        return false;
    }








    function getMetadataForAllFields(oMetadata, sObjectName) {
        var aMetadataFields = oMetadata.getMetadataFields(sObjectName, sObjectName, null);
        var aCustomFieldsToSetSufix = _.filter(aMetadataFields, function (oMetadataField) {
            return oMetadataField.IS_CUSTOM === 1 && oMetadataField.UOM_CURRENCY_FLAG !== 1;
        });
        _.each(aCustomFieldsToSetSufix, function (oCustomFieldsToSetSufix) {
            oCustomFieldsToSetSufix.COLUMN_ID = oCustomFieldsToSetSufix.COLUMN_ID + '_MANUAL';
        });
        return aMetadataFields;
    }

}

MasterDataBaseObject.prototype = Object.create(MasterDataBaseObject.prototype);
MasterDataBaseObject.prototype.constructor = MasterDataBaseObject;
export default {fs,path,appRoot,_,helpers,BusinessObjectTypes,Resources,MasterdataReadProcedures,Limits,Helper,Metadata,UrlToSqlConverter,MessageLibrary,MessageOperation,PlcException,MessageCode,MessageDetails,ValidationInfoCode,Severity,AdministrationObjType,Operation,BatchOperation,BusinessObjectValidatorUtils,TemplateEngine,oTemplateEngine,aAuditFieldsForVersionedEntries,aErrorFieldsInTemporaryTables,MasterDataBaseObject};
