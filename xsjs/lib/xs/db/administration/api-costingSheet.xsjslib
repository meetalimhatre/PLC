var _ = $.require('lodash');
var helpers = $.require('../../util/helpers');
var BusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
var Resources = $.require('../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../util/masterdataResources').BusinessObjectsEntities;
var Limits = $.require('../../util/masterdataResources').Limits;
var Misc = $.require('../persistency-misc').Misc;
var Helper = $.require('../persistency-helper').Helper;
var Metadata = $.require('../persistency-metadata').Metadata;
var apiHelpers = await $.import('xs.db.administration', 'api-helper');
var CostingSheetRow = await $.import('xs.db.administration', 'api-costingSheetRow').CostingSheetRow;
var ProjectTables = await $.import('xs.db', 'persistency-project').Tables;
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

var Procedures = Object.freeze({ costing_sheet_read: 'sap.plc.db.administration.procedures::p_costing_sheet_read' });

async function CostingSheet(dbConnection, hQuery, hQueryRepl) {

    this.helper = await new Helper($, hQuery, dbConnection);
    this.metadata = await new Metadata($, hQuery, null, sUserId);
    this.misc = await new Misc($, hQuery, sUserId);
    this.converter = await new UrlToSqlConverter();
    var sCostingSheet = BusinessObjectTypes.CostingSheet; // CostingSheet
    var sCostingSheetRowDependencies = BusinessObjectTypes.CostingSheetRowDependencies;
    var sCostingSheetRow = BusinessObjectTypes.CostingSheetRow;
    var costingSheetRow = await new CostingSheetRow(dbConnection, hQuery, hQueryRepl);
    var oResults = await initResults();
    var aMetadataFields = null;
    var that = this;


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
        var noRecords = Limits.Top;
        var sSQLstring = '';
        var noSkipRecords = 0;

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheet, sCostingSheet, null);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            sTextFromAutocomplete = oGetParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, aMetadataFields);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.skip)) {
            noSkipRecords = parseInt(oGetParameters.skip);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.top)) {
            noRecords = parseInt(oGetParameters.top);
        }

        try {
            var procedure = dbConnection.loadProcedure(Procedures.costing_sheet_read);
            var result = procedure(sLanguage, sMasterDataDate, sTextFromAutocomplete, sSQLstring, noRecords, noSkipRecords);

            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = Array.slice(result.OT_COSTING_SHEET);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_TEXT);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        } catch (e) {
            const sLogMessage = `Error during reading costing sheet data when procedure ${ Procedures.costing_sheet_read } is called.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }

        return oReturnObject;

    };

    /**
	 * Delete data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of costing sheets, costing sheet rows, costing sheet base, costing sheet base row, 
	 * costing sheet overheadm costing sheet overhead row, costing sheet row dependencies
	 * @returns {object}  oResult     - deleted entries / errors
	 */
    this.remove = function (oBatchItems, sMasterDataDate) {

        var oResult = costingSheetRow.remove(oBatchItems, sMasterDataDate);

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheet, sCostingSheet, null);
        }

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = [];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oResultDelete = that.removeCostingSheetRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultDelete = that.removeCostingSheetTextRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        return oResult;

    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheet - deleted entry
	 *        E.g: {,
	                     "COSTING_SHEET_ID": "COGS",
	                     "_VALID_FROM": "2015-03-25T11:13:58.315Z"
	                  }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetRow = async function (oCostingSheet, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID'],
            UsedInBusinessObjects: [{
                    'BusinessObjectName': BusinessObjectTypes.Project,
                    'TableName': ProjectTables.project,
                    'FieldsName': [['COSTING_SHEET_ID']],
                    'IsVersioned': false
                }]
        };

        var oResult = await apiHelpers.removeRow(oCostingSheet, sMasterDataDate, oConfiguration, hQuery);

        //delete entries from costing sheet row
        var aCostingSheetRowRecords = await apiHelpers.findValidEntriesInTable(Resources[sCostingSheetRow].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[0]], [oCostingSheet.COSTING_SHEET_ID], sMasterDataDate, hQuery);
        if (aCostingSheetRowRecords.length > 0) {
            _.each(aCostingSheetRowRecords, function (oCostingSheetRowRecords) {
                costingSheetRow.removeCostingSheetRowRow(oCostingSheetRowRecords, sMasterDataDate);
            });
        }

        //delete entries from costing sheet dependencies
        var aCostingSheetDependenciesRecords = await apiHelpers.findValidEntriesInTable(Resources[sCostingSheetRowDependencies].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[0]], [oCostingSheet.COSTING_SHEET_ID], sMasterDataDate, hQuery);
        if (aCostingSheetDependenciesRecords.length > 0) {
            var iDeletedTextRecords = await apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetRowDependencies].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[0]], [oCostingSheet.COSTING_SHEET_ID], sMasterDataDate, hQuery);
            if (iDeletedTextRecords !== aCostingSheetDependenciesRecords.length) {
                const sLogMessage = `Not all dependencies entries were deleted.`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
            }
        }
        return oResult;
    };

    /**
	 * Delete text row
	 *
	 * @param {object} oCostingSheetText - deleted entry
	 *        E.g: {
	                      "COSTING_SHEET_ID": "0001",
	                      "LANGUAGE":"EN",
	                      "_VALID_FROM": "2015-03-25T11:13:58.315Z"
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetTextRow = async function (oCostingSheetText, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID']
        };

        return await apiHelpers.removeTextRow(oCostingSheetText, sMasterDataDate, oConfiguration, hQuery);

    };

    /**
	 * Update data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of costing sheets + an array of costing sheet texts
	 * @returns {object}  oResult     - updated entries / errors
	 */
    this.update = async function (oBatchItems, sMasterDataDate) {

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheet, sCostingSheet, null);
        }
        var oResult = await costingSheetRow.update(oBatchItems, sMasterDataDate);

        var aBatchItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = [];
        _.each(aBatchItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oResultUpdate = that.updateCostingSheetRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES].push(oResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultUpdate = that.updateCostingSheetTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES].push(oTextResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        return oResult;

    };

    /**
     * Update row
     *
     * @param {object} CostingSheet - updated entry
     *        E.g: {
                      "COSTING_SHEET_ID": "INT",
                      "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                   }
     * @param   {string} sMasterDataDate  - master data timestamp
     * @returns {object} oResult          - updated entry
     */
    this.updateCostingSheetRow = async function (oCostingSheet, sMasterDataDate) {
        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID']
        };

        var oResult = await apiHelpers.updateRow(oCostingSheet, sMasterDataDate, oConfiguration, hQuery, this.helper);

        return oResult;

    };

    /**
	 * Update text row
	 *
	 * @param {object} oCostingSheetText - updated entry
	 *        E.g: {
	                      "COSTING_SHEET_ID": "0001",
	                      "COSTING_SHEET_DESCRIPTION":"Test 0001",
	                      "LANGUAGE":"EN",
	                      "_VALID_FROM": "2015-03-25T11:13:58.315Z"
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - updated entry
	 */
    this.updateCostingSheetTextRow = async function (oCostingSheetText, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID'],
            aTextColumns: ['COSTING_SHEET_DESCRIPTION']
        };

        return await apiHelpers.updateTextRow(oCostingSheetText, sMasterDataDate, oConfiguration, hQuery, this.helper);

    };

    /**
	 * Check if the referenced objects exists; if they do not exist, then create them
	 *
	 * @param   {object} oCostingSheet - entry that is checked
	 * @param   {string} sMasterDataDate  - master data timestamp
	 */
    this.checkCreateReferenceObjects = async function (oCostingSheet, sMasterDataDate) {

        //take each referenced object
        var aFieldsMainPlcTable = ['CONTROLLING_AREA_ID'];//name in t_costing_sheet
        var aKeyFieldsRefObjectPlcTable = ['CONTROLLING_AREA_ID'];//name in t_controlling_area  
        var aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheet);
        var oControllingArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
        apiHelpers.checkObjectExists(oControllingArea, sMasterDataDate, BusinessObjectTypes.ControllingArea, hQuery);

    };


    /**
	 * Insert data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of costing sheets + an array of costing sheets texts, and dependent object
	 * @returns {object}  oResult     - inserted entries / errors
	 */
    this.insert = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheet, sCostingSheet, null);
        }

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = [];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oMainResultInsert = that.insertCostingSheetRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES].push(oMainResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oTextResultInsert = that.insertCostingSheetTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES].push(oTextResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_TEXT_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var oResultRow = costingSheetRow.insert(oBatchItems, sMasterDataDate);

        oResult.entities = _.extend(oResult.entities, oResultRow.entities);
        oResult.conflictingEntities = _.extend(oResult.conflictingEntities, oResultRow.conflictingEntities);
        if (oResultRow.hasErrors === true)
            oResult.hasErrors = oResultRow.hasErrors;
        oResult.errors = _.union(oResult.errors, oResultRow.errors);

        return oResult;

    };

    /**
	 * Insert row
	 *
	 * @param {object} oCostingSheet - inserted entry
	 *        E.g: {
	                      "COSTING_SHEET_ID": "0001",
	                      ...
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
    this.insertCostingSheetRow = async function (oCostingSheet, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID'],
            aFieldsNotNull: ['CONTROLLING_AREA_ID']
        };

        var oResult = await apiHelpers.insertRow(oCostingSheet, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);

        //check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
        //if exists, create in in PLC
        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };

    /**
	 * Insert text row
	 *
	 * @param {object} oCostingSheetText - inserted entry
	 *        E.g: {
	                      "COSTING_SHEET_ID": "0001",
	                      "COSTING_SHEET_DESCRIPTION":"Test 0001",
	                      "LANGUAGE":"EN"
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - inserted entry
	 */
    this.insertCostingSheetTextRow = async function (oCostingSheetText, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheet,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ID']
        };

        return await apiHelpers.insertTextRow(oCostingSheetText, sMasterDataDate, oConfiguration, hQuery, this.helper);

    };

    /**
	 * inits an object that will contain the operations results for CostingSheet
	 */
    function initResults() {

        var oResult = {
            entities: {},
            hasErrors: false,
            errors: []
        };

        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = [];

        return oResult;
    }

}

CostingSheet.prototype = Object.create(CostingSheet.prototype);
CostingSheet.prototype.constructor = CostingSheet;
export default {_,helpers,BusinessObjectTypes,Resources,BusinessObjectsEntities,Limits,Misc,Helper,Metadata,apiHelpers,CostingSheetRow,ProjectTables,UrlToSqlConverter,MessageLibrary,MessageOperation,PlcException,Code,MessageDetails,AdministrationObjType,sSessionId,sUserId,Procedures,CostingSheet};
