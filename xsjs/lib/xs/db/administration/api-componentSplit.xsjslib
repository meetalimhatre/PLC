var _ = $.require('lodash');
var helpers = $.require('../../util/helpers');
var BusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
var Resources = $.require('../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../util/masterdataResources').BusinessObjectsEntities;
var Limits = $.require('../../util/masterdataResources').Limits;
var Helper = $.require('../persistency-helper').Helper;
var Misc = $.require('../persistency-misc').Misc;
var Metadata = $.require('../persistency-metadata').Metadata;
var apiHelpers = $.import('xs.db.administration', 'api-helper');
var ProjectTables = $.import('xs.db', 'persistency-project').Tables;
var UrlToSqlConverter = $.require('../../util/urlToSqlConverter').UrlToSqlConverter;

const MessageLibrary = $.require('../../util/message');
const MessageOperation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const AdministrationObjType = MessageLibrary.AdministrationObjType;

var sSessionId;
var sUserId;
sSessionId = sUserId = $.getPlcUsername();

var Procedures = await Object.freeze({ component_split_read: 'sap.plc.db.administration.procedures::p_component_split_read' });

async function ComponentSplit(dbConnection, hQuery, hQueryRepl) {
    this.helper = await new Helper($, hQuery, dbConnection);
    var sBusinessObjectName = BusinessObjectTypes.ComponentSplit;
    var sBusinessObjectNameCostEl = BusinessObjectTypes.ComponentSplitAccountGroup;
    var sBusinessObjectNameCostElGroup = BusinessObjectTypes.AccountGroup;
    this.metadata = await new Metadata($, hQuery, null, sUserId);
    this.misc = await new Misc($, hQuery, sUserId);
    this.converter = await new UrlToSqlConverter();
    var that = this;
    var aMetadataFields = null;

    var oConfigurationCostEl = {
        sObjectName: sBusinessObjectNameCostEl,
        aPartialKeyPlcTableColumns: [
            'ACCOUNT_GROUP_ID',
            'COMPONENT_SPLIT_ID'
        ]
    };

    var oConfiguration = {
        sObjectName: sBusinessObjectName,
        aPartialKeyPlcTableColumns: ['COMPONENT_SPLIT_ID'],
        aTextColumns: ['COMPONENT_SPLIT_DESCRIPTION'],
        aFieldsNotChangeble: ['CONTROLLING_AREA_ID'],
        UsedInBusinessObjects: [{
                'BusinessObjectName': BusinessObjectTypes.Project,
                'TableName': ProjectTables.project,
                'FieldsName': [['COMPONENT_SPLIT_ID']],
                'IsVersioned': false
            }]
    };

    /**
     * Get data (this method is called from persistency-configuration.xsjslib)
     *
     * @param   {object} oGetParameters - object with parameters (determined from URL)
     * @param   {string} sLanguage      - language (taken from Session)
     * @returns {object} oReturnObject  - object containing the main entities, referenced entities and texts
     */
    this.get = async function (oGetParameters, sLanguage, sMasterDataDate) {

        var oReturnObject = {};
        var sTextFromAutocomplete = '';
        var sSQLstring = '';
        var noRecords = Limits.Top;
        var noSkipRecords = 0;

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            sTextFromAutocomplete = oGetParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, aMetadataFields);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.top)) {
            noRecords = parseInt(oGetParameters.top);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.skip)) {
            noSkipRecords = parseInt(oGetParameters.skip);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        try {
            var procedure = dbConnection.loadProcedure(Procedures.component_split_read);
            var result = procedure(sLanguage, sMasterDataDate, sTextFromAutocomplete, sSQLstring, noRecords, noSkipRecords);

            oReturnObject[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = Array.slice(result.OT_COMPONENT_SPLIT);

            if (await helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
                oReturnObject[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES] = Array.slice(result.OT_COMPONENT_SPLIT_TEXT);
            }

            oReturnObject[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES] = Array.slice(result.OT_COMPONENT_SPLIT_ACCOUNT_GROUP);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = Array.slice(result.OT_ACCOUT_GROUPS);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        } catch (e) {
            const sLogMessage = `Error during reading data for component split when procedure ${ Procedures.component_split_read } is called.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }

        return oReturnObject;

    };

    /**
     * Delete data (this method is called from persistency-configuration.xsjslib)
     *
     * @param   {objects} oBatchItems - object containing an array of component splits and account groups
     * @returns {object}  oResult     - deleted entries / errors
     */
    this.remove = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = [];

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);
        }

        _.each(aBatchMainItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oResultDelete = that.removeComponentSplitRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES].push(oResultDelete);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultDelete = that.removeComponentSplitTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES].push(oTextResultDelete);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        return oResult;

    };

    /**
      * Delete row
      *
      * @param {object} oComponentSplit - deleted entry
      *        E.g: {
                       "COMPONENT_SPLIT_ID": "INT",
                       "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                    }
      * @param   {string} sMasterDataDate  - master data timestamp
      * @returns {object} oResult          - deleted entry
      */
    this.removeComponentSplitRow = async function (oComponentSplit, sMasterDataDate) {
        var oResult = await apiHelpers.removeRow(oComponentSplit, sMasterDataDate, oConfiguration, hQuery);

        //delete entries from table t_component_split_account_group
        var aGrRecords = await apiHelpers.findValidEntriesInTable(Resources[sBusinessObjectNameCostEl].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[0]], [oComponentSplit.COMPONENT_SPLIT_ID], sMasterDataDate, hQuery);
        if (aGrRecords.length !== 0) {
            var iDeletedRecords = await apiHelpers.updateEntriesWithValidToInTable(Resources[sBusinessObjectNameCostEl].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[0]], [oComponentSplit.COMPONENT_SPLIT_ID], sMasterDataDate, hQuery);
            if (iDeletedRecords !== aGrRecords.length) {
                const sLogMessage = `Not all entries for component split were deleted.`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
            }
        }

        return oResult;
    };

    /**
      * Delete row
      *
      * @param {object} oComponentSplit - deleted entry
      *        E.g: {,
                       "ACCOUNT_GROUP_ID": "CEG",
                       "COMPONENT_SPLIT_ID": "CS",
                       "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                    }
      * @param   {string} sMasterDataDate  - master data timestamp
      * @returns {object} oResult          - deleted entry
      */
    this.removeAccountGroupsRow = async function (oAccountGroup, sMasterDataDate) {

        return await apiHelpers.removeRow(oAccountGroup, sMasterDataDate, oConfigurationCostEl, hQuery);

    };

    /**
       * Remove text row
       *
       * @param {object} oComponentSplitText - deleted entry
       *        E.g: {
                        "COMPONENT_SPLIT_ID": "INT",
                        "_VALID_FROM": "2015-03-25T11:13:58.315Z",
                        "LANGUAGE":"EN"
                     }
       * @param   {string} sMasterDataDate  - master data timestamp
       * @returns {object} oResult          - deleted entry
       */
    this.removeComponentSplitTextRow = async function (oComponentSplitText, sMasterDataDate) {

        return await apiHelpers.removeTextRow(oComponentSplitText, sMasterDataDate, oConfiguration, hQuery);

    };

    this.removeAllAccountGroupsforComponentSplit = async function (oComponentSplit, sMasterDataDate) {
        var sTableName = Resources[sBusinessObjectNameCostEl].dbobjects.plcTable;

        var aValues = [];
        var aStmtBuilder = [];

        aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE COMPONENT_SPLIT_ID = ? AND _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
        aValues.push(oComponentSplit.COMPONENT_SPLIT_ID);
        await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    };

    /**
       * Insert data (this method is called from persistency-configuration.xsjslib)
       *
       * @param   {objects} oBatchItems - object containing an array of component splits + an array of component split texts
       * @returns {object}  oResult     - inserted entries / errors
      */
    this.insert = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = [];

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);
        }

        _.each(aBatchMainItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oMainResultInsert = that.insertComponentSplitRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES].push(oMainResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultInsert = that.insertComponentSplitTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES].push(oTextResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchAccountGroupsItems = oBatchItems[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES];
        oResult.entities[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES] = [];
        _.each(aBatchAccountGroupsItems, async function (oRecord) {
            try {
                var oAccGrResultInsert = that.insertSelectedAccountGroupsRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES].push(oAccGrResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        return oResult;

    };

    /**
       * Insert row
       *
       * @param {object} oComponentSplit - inserted entry
       *        E.g: {
                        "COMPONENT_SPLIT_ID": "CSID"
                     }
       * @param   {string} sMasterDataDate  - master data timestamp
       * @returns {object} oResult          - inserted entry
       */
    this.insertComponentSplitRow = async function (oComponentSplit, sMasterDataDate) {

        var oResult = await apiHelpers.insertRow(oComponentSplit, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);

        //check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
        //if exists, create in in PLC
        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };

    this.insertComponentSplitTextRow = async function (oComponentSplitText, sMasterDataDate) {

        return await apiHelpers.insertTextRow(oComponentSplitText, sMasterDataDate, oConfiguration, hQuery, this.helper);

    };

    this.insertSelectedAccountGroupsRow = async function (oCostElGrCostComp, sMasterDataDate) {
        const sCommonLogMessage = 'Inconsistent or missing data for Account Group.';

        var aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(oConfigurationCostEl.aPartialKeyPlcTableColumns, oCostElGrCostComp);
        var aFoundCostElGroupRecords = await apiHelpers.findValidEntriesInTable(Resources[sBusinessObjectNameCostElGroup].dbobjects.plcTable, [oConfigurationCostEl.aPartialKeyPlcTableColumns[0]], [aFieldsValuesMainPlcTable[0]], sMasterDataDate, hQuery);
        if (aFoundCostElGroupRecords.length === 0) {
            const oMessageDetails = new MessageDetails();
            oMessageDetails.businessObj = sBusinessObjectNameCostElGroup;
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;

            const sLogMessage = `${ sCommonLogMessage } No account group found in in t_account_group.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }
        var aFoundComponentSplitRecords = await apiHelpers.findValidEntriesInTable(Resources[sBusinessObjectName].dbobjects.plcTable, [oConfigurationCostEl.aPartialKeyPlcTableColumns[1]], [aFieldsValuesMainPlcTable[1]], sMasterDataDate, hQuery);
        if (aFoundComponentSplitRecords.length === 0) {
            const oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;

            const sLogMessage = `${ sCommonLogMessage } No component split found in t_component_split.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }
        if (aFoundCostElGroupRecords[0].CONTROLLING_AREA_ID != aFoundComponentSplitRecords[0].CONTROLLING_AREA_ID) {
            const oMessageDetails = new MessageDetails();

            const sLogMessage = `${ sCommonLogMessage } Different controlling areas in t_account_group and t_component_split.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        return await apiHelpers.insertRow(oCostElGrCostComp, sMasterDataDate, oConfigurationCostEl, hQuery, hQueryRepl, this.helper);

    };

    this.checkCreateReferenceObjects = async function (oComponentSplit, sMasterDataDate) {

        //take each referenced object      	
        var aFieldsMainPlcTable = ['CONTROLLING_AREA_ID'];//name in t_component_split
        var aKeyFieldsRefObjectPlcTable = ['CONTROLLING_AREA_ID'];//name in t_controlling_area  
        var aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oComponentSplit);
        var oControllingArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
        apiHelpers.checkObjectExists(oControllingArea, sMasterDataDate, BusinessObjectTypes.ControllingArea, hQuery);

    };

    /**
       * Update data (this method is called from persistency-configuration.xsjslib)
       *
       * @param   {objects} oBatchItems - object containing an array of component splits + an array of component split texts
       * @returns {object}  oResult     - updated entries / errors
      */
    this.update = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES];
        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES];
        var aBatchAccGrItems = oBatchItems[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES] = [];

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sBusinessObjectName, sBusinessObjectName, null);
        }
        // for update, the component_split_table cannot be updated, only the component_split_account_group table
        // the decision was that we deactivate all the component_split_account_group records for the component_split_id
        // and insert them again in the table with a new _VALID_FROM date
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                //apiHelpers.checkColumns(oRecord,aMetadataFields);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES].push(oRecord);
                if (!helpers.isNullOrUndefined(aBatchAccGrItems)) {
                    that.removeAllAccountGroupsforComponentSplit(oRecord, sMasterDataDate);
                }
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultUpdate = that.updateComponentSplitTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES].push(oTextResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COMPONENT_SPLIT_TEXT_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        _.each(aBatchAccGrItems, async function (oRecord) {
            try {
                var oAccGrResultUpdate = that.insertSelectedAccountGroupsRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES].push(oAccGrResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.SELECTED_ACCOUNT_GROUPS_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        return oResult;

    };

    /**
       * Update text row
       *
       * @param {object} oComponentSplitText - updated entry
       *        E.g: {
                        "COMPONENT_SPLIT_ID": "INT",
                        "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                     }
       * @param   {string} sMasterDataDate  - master data timestamp
       * @returns {object} oResult          - updated entry
       */
    this.updateComponentSplitTextRow = async function (oComponentSplitText, sMasterDataDate) {

        return await apiHelpers.updateTextRow(oComponentSplitText, sMasterDataDate, oConfiguration, hQuery, this.helper);

    };
}

ComponentSplit.prototype = await Object.create(ComponentSplit.prototype);
ComponentSplit.prototype.constructor = ComponentSplit;
export default {_,helpers,BusinessObjectTypes,Resources,BusinessObjectsEntities,Limits,Helper,Misc,Metadata,apiHelpers,ProjectTables,UrlToSqlConverter,MessageLibrary,MessageOperation,PlcException,Code,MessageDetails,AdministrationObjType,sSessionId,sUserId,Procedures,ComponentSplit};
