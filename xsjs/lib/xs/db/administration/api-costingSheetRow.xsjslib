var _ = $.require('lodash');
var helpers = $.require('../../util/helpers');
var BusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
var Resources = $.require('../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../util/masterdataResources').BusinessObjectsEntities;
var CostingSheetResources = $.require('../../util/masterdataResources').CostingSheetResources;
var aSource = $.require('../../util/masterdataResources').Source;
var Helper = $.require('../persistency-helper').Helper;
var Metadata = $.require('../persistency-metadata').Metadata;
var Misc = $.require('../persistency-misc').Misc;
var apiHelpers = $.import('xs.db.administration', 'api-helper');
var UrlToSqlConverter = $.require('../../util/urlToSqlConverter').UrlToSqlConverter;

const MessageLibrary = $.require('../../util/message');
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const MessageOperation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const AdministrationObjType = MessageLibrary.AdministrationObjType;
const FormulaInterpreterError = MessageLibrary.FormulaInterpreterErrorMapping;
const GenericSyntaxValidator = $.require('../../validator/genericSyntaxValidator').GenericSyntaxValidator;

var sSessionId;
var sUserId;
sSessionId = sUserId = $.getPlcUsername();

const Procedures = Object.freeze({
    costing_sheet_row_read: 'sap.plc.db.administration.procedures::p_costing_sheet_row_read',
    set_lock: 'sap.plc.db.administration.procedures::p_set_lock',
    checkFormula: 'sap.plc.db.administration.procedures::p_check_formulas_costing_sheet_overhead_row'
});

const Tables = Object.freeze({
    costing_sheet_overhead_row_formula: 'sap.plc.db::basis.t_costing_sheet_overhead_row_formula',
    costing_sheet_overhead_row: 'sap.plc.db::basis.t_costing_sheet_overhead_row',
    costing_sheet: 'sap.plc.db::basis.t_costing_sheet',
    costing_sheet_row: 'sap.plc.db::basis.t_costing_sheet_row',
    costing_sheet_row_dependencies: 'sap.plc.db::basis.t_costing_sheet_row_dependencies',
    item_category: 'sap.plc.db::basis.t_item_category'
});

const Sequences = Object.freeze({
    costing_sheet_overhead: 'sap.plc.db.sequence::s_costing_sheet_overhead',
    costing_sheet_overhead_row: 'sap.plc.db.sequence::s_costing_sheet_overhead_row',
    costing_sheet_base: 'sap.plc.db.sequence::s_costing_sheet_base',
    costing_sheet_overhead_row_formula: 'sap.plc.db.sequence::s_costing_sheet_overhead_row_formula'
});

async function CostingSheetRow(dbConnection, hQuery, hQueryRepl) {

    this.helper = new Helper($, hQuery, dbConnection);
    this.metadata = new Metadata($, hQuery, null, sUserId);
    this.misc = new Misc($, hQuery, sUserId);
    this.converter = new UrlToSqlConverter();
    var sCostingSheet = BusinessObjectTypes.CostingSheet; // CostingSheet
    var sCostingSheetRowDependencies = BusinessObjectTypes.CostingSheetRowDependencies;
    var sCostingSheetOverhead = BusinessObjectTypes.CostingSheetOverHead;
    var sCostingSheetOverheadRow = BusinessObjectTypes.CostingSheetOverHeadRow;
    var sCostingSheetBaseRow = BusinessObjectTypes.CostingSheetBaseRow;
    var sCostingSheetBase = BusinessObjectTypes.CostingSheetBase;
    var sCostingSheetRow = BusinessObjectTypes.CostingSheetRow;
    var sCostingSheetRowTextRow = BusinessObjectTypes.CostingSheetRow;
    var sCostingSheetOverheadCustomField = BusinessObjectTypes.Item;
    var sAccountGroup = BusinessObjectTypes.AccountGroup;
    var sAccount = BusinessObjectTypes.Account;
    var that = this;
    var aMetadataFields = null;
    var oResults = initResults();
    var oCostingSheetRowBaseId = {};
    var oCostingSheetOverheadId = {};
    var oCostingSheetOverheadRowId = {};
    var aFoundPlcRecordsAccountGroup = {};
    var genericSyntaxValidator = new GenericSyntaxValidator();

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

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            sTextFromAutocomplete = oGetParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheetRow, sCostingSheetRow, null);
        }
        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, aMetadataFields);
        }

        try {
            var procedure = dbConnection.loadProcedure(Procedures.costing_sheet_row_read);
            var result = procedure(sLanguage, sMasterDataDate, sTextFromAutocomplete, sSQLstring);

            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_ROW);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_ROW__TEXT);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_BASE);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_BASE_ROW);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_OVERHEAD);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_OVERHEAD_ROW);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = Array.slice(result.OT_ACCOUNT_GROUP);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = Array.slice(result.OT_ACCOUNT_GROUP__TEXT);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = Array.slice(result.OT_COSTING_SHEET_ROW_DEPENDENCIES);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
            oReturnObject[BusinessObjectsEntities.BUSINESS_AREA_ENTITIES] = Array.slice(result.OT_BUSINESS_AREA);
            oReturnObject[BusinessObjectsEntities.PROFIT_CENTER_ENTITIES] = Array.slice(result.OT_PROFIT_CENTER);
            oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
            oReturnObject[BusinessObjectsEntities.OVERHEAD_GROUP_ENTITIES] = Array.slice(result.OT_OVERHEAD_GROUP);
            oReturnObject[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = Array.slice(result.OT_ACTIVITY_TYPE);
            oReturnObject[BusinessObjectsEntities.COST_CENTER_ENTITIES] = Array.slice(result.OT_COST_CENTER);
            oReturnObject[BusinessObjectsEntities.WORK_CENTER_ENTITIES] = Array.slice(result.OT_WORK_CENTER);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.COSTING_SHEET_ENTITIES] = Array.slice(result.OT_COSTING_SHEET);

        } catch (e) {
            const sLogMessage = `Error during get of CostingSheetRow when procedure ${ Procedures.costing_sheet_row_read } is called.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }

        return oReturnObject;

    };

    /**
	 * Delete data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of costing sheet rows, costing sheet base, costing sheet base row, 
	 * costing sheet overheadm costing sheet overhead row, costing sheet row dependencies
	 * @returns {object}  oResult     - deleted entries / errors
	 */
    this.remove = async function (oBatchItems, sMasterDataDate) {

        var oResult = initResults();

        var aCostingSheetOverheadRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES];
        _.each(aCostingSheetOverheadRowItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetOverheadRowRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aCostingSheetOverheadItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES];
        _.each(aCostingSheetOverheadItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetOverheadRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aCostingSheetRowBaseRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES];
        _.each(aCostingSheetRowBaseRowItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetBaseRowRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aCostingSheetRowBaseItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES];
        _.each(aCostingSheetRowBaseItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetBaseRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetRowRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aBatchMainTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES];
        _.each(aBatchMainTextItems, async function (oRecord) {
            try {
                var oResultDelete = that.removeCostingSheetTextRowRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        var aBatchDependenciesItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = [];
        _.each(aBatchDependenciesItems, async function (oRecord) {
            try {
                var oCostingSheetRowDependenciesResultDelete = that.removeCostingSheetRowDependencies(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES, e, MessageOperation.DELETE, oResult);
            }
        });

        return oResult;
    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheetOverhead - deleted entry
	 *        E.g: {,
 	                    "COSTING_SHEET_OVERHEAD_ID": "C010",
 	                    "IS_ROLLED_UP": 1,
 	                    "_VALID_FROM": "2015-03-25T11:13:58.315Z"
 	                 }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetOverheadRow = async function (oCostingSheetOverhead, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetOverhead,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_OVERHEAD_ID',
                'IS_ROLLED_UP'
            ]
        };
        var oResult = [];

        oResult = apiHelpers.removeRow(oCostingSheetOverhead, sMasterDataDate, oConfiguration, hQuery);

        //delete entries from table t_costing_sheet_overhead_row
        var iDeletedRecords = apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetOverheadRow].dbobjects.plcTable, oConfiguration.aPartialKeyPlcTableColumns, oCostingSheetOverhead, sMasterDataDate, hQuery);

        return oResult;

    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheetOverheadRow - deleted entry
	 *        E.g: {,
 	                     "COSTING_SHEET_OVERHEAD_ROW_ID": 1,
 	                     "COSTING_SHEET_OVERHEAD_ID": "C010",
 	                     "VALID_FROM": "2015-03-25T11:13:58.315Z",
 	                     "VALID_TO": "2015-03-25T11:13:58.315Z",
 	                     "_VALID_FROM": "2015-03-25T11:13:58.315Z"
 	                  }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetOverheadRowRow = async function (oCostingSheetOverheadRow, sMasterDataDate) {

        let oConfiguration = {
            sObjectName: sCostingSheetOverheadRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_OVERHEAD_ROW_ID',
                'COSTING_SHEET_OVERHEAD_ID'
            ]
        };

        that.deleteCostingSheetOverheadRowFormula(oCostingSheetOverheadRow, oConfiguration);

        return apiHelpers.removeRow(oCostingSheetOverheadRow, sMasterDataDate, oConfiguration, hQuery);

    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheetBaseRow - deleted entry
	 *        E.g: {,
                       "COSTING_SHEET_BASE_ID": "123",
                       "ITEM_CATEGORY_ID": 1,
                       "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                    }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetBaseRowRow = async function (oCostingSheetBaseRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetBaseRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_BASE_ID',
                'ITEM_CATEGORY_ID'
            ]
        };

        return apiHelpers.removeRow(oCostingSheetBaseRow, sMasterDataDate, oConfiguration, hQuery);

    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheetBase - deleted entry
	 *        E.g: {,
                        "COSTING_SHEET_BASE_ID": "123",
                        "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                     }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetBaseRow = async function (oCostingSheetBase, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetBase,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        var oResult = [];

        oResult = apiHelpers.removeRow(oCostingSheetBase, sMasterDataDate, oConfiguration, hQuery);

        //delete entries from table t_costing_sheet_base_row
        var iDeletedRecords = apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetBaseRow].dbobjects.plcTable, oConfiguration.aPartialKeyPlcTableColumns, oCostingSheetBase, sMasterDataDate, hQuery);

        return oResult;

    };

    /**
	 * Delete text row
	 *
	 * @param {object} oCostingSheetRowText - deleted entry
	 *        E.g: {
	                      "COSTING_SHEET_ROW_ID": "0001",
	                      "LANGUAGE":"EN",
	                      "_VALID_FROM": "2015-03-25T11:13:58.315Z"
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetTextRowRow = async function (oCostingSheetRowText, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_ROW_ID']
        };

        return apiHelpers.removeTextRow(oCostingSheetRowText, sMasterDataDate, oConfiguration, hQuery);

    };

    /**
	 * Delete row
	 *
	 * @param {object} oCostingSheetRow - deleted entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetRowRow = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ]
        };

        var oConfigurationOverhead = {
            sObjectName: sCostingSheetOverhead,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_OVERHEAD_ID']
        };

        var oConfigurationBase = {
            sObjectName: sCostingSheetBase,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        var oResult = [];
        var aFieldsValuesCostingSheetRowTable = apiHelpers.getColumnKeyValues(oConfiguration.aPartialKeyPlcTableColumns, oCostingSheetRow);
        var aCostingSheetRowRecords = apiHelpers.findValidEntriesInTable(Resources[sCostingSheetRow].dbobjects.plcTable, oConfiguration.aPartialKeyPlcTableColumns, aFieldsValuesCostingSheetRowTable, sMasterDataDate, hQuery);


        oResult = apiHelpers.removeRow(oCostingSheetRow, sMasterDataDate, oConfiguration, hQuery);
        //delete entries from table t_costing_sheet_overhead
        if (aCostingSheetRowRecords.length !== 0) {
            if (!helpers.isNullOrUndefined(aCostingSheetRowRecords[0].COSTING_SHEET_OVERHEAD_ID)) {
                that.deleteCostingSheetOverheadFormulas(aCostingSheetRowRecords[0].COSTING_SHEET_OVERHEAD_ID);
                apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetOverheadRow].dbobjects.plcTable, oConfigurationOverhead.aPartialKeyPlcTableColumns, [aCostingSheetRowRecords[0].COSTING_SHEET_OVERHEAD_ID], sMasterDataDate, hQuery);
                apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetOverhead].dbobjects.plcTable, oConfigurationOverhead.aPartialKeyPlcTableColumns, [aCostingSheetRowRecords[0].COSTING_SHEET_OVERHEAD_ID], sMasterDataDate, hQuery);
            }
        }

        //delete entries from table t_costing_sheet_base
        if (aCostingSheetRowRecords.length !== 0) {
            if (!helpers.isNullOrUndefined(aCostingSheetRowRecords[0].COSTING_SHEET_BASE_ID)) {
                apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetBaseRow].dbobjects.plcTable, oConfigurationBase.aPartialKeyPlcTableColumns, [aCostingSheetRowRecords[0].COSTING_SHEET_BASE_ID], sMasterDataDate, hQuery);
                apiHelpers.updateEntriesWithValidToInTable(Resources[sCostingSheetBase].dbobjects.plcTable, oConfigurationBase.aPartialKeyPlcTableColumns, [aCostingSheetRowRecords[0].COSTING_SHEET_BASE_ID], sMasterDataDate, hQuery);
            }
        }

        //remove all dependencies for this row
        this.removeAllDependeciesforCostingSheetRow(oCostingSheetRow, sMasterDataDate);

        return oResult;
    };

    /**
	 * Delete costing sheet row dependencies
	 *
	 * @param {object} oCostingSheetText - deleted entry
	 *        E.g: {
	 *        		  "SOURCE_ROW": "1",
	                      "TARGET_ROW": "1",
	                      "COSTING_SHEET_ID": "0001",	                      
	                      "_VALID_FROM": "2015-03-25T11:13:58.315Z"
	                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeCostingSheetRowDependencies = async function (oCostingSheetDependencies, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRowDependencies,
            aPartialKeyPlcTableColumns: [
                'SOURCE_ROW_ID',
                'TARGET_ROW_ID',
                'COSTING_SHEET_ID'
            ]
        };

        return apiHelpers.removeRow(oCostingSheetDependencies, sMasterDataDate, oConfiguration, hQuery);

    };

    /**
	 * Invalidates all the costing sheet row dependencies for a COSTING_SHEET_ID, COSTING_SHEET_ROW_ID
	 */

    this.removeAllDependeciesforCostingSheetRow = async function (oRecord, sMasterDataDate) {
        var sTableName = Resources[sCostingSheetRowDependencies].dbobjects.plcTable;

        var aValues = [];
        var aStmtBuilder = [];

        aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE COSTING_SHEET_ID = ? AND SOURCE_ROW_ID = ? AND _VALID_TO IS NULL');
        aValues.push(String(sMasterDataDate));
        aValues.push(oRecord.COSTING_SHEET_ID);
        aValues.push(oRecord.COSTING_SHEET_ROW_ID);

        hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    };

    /**
	 * Invalidates a costing sheet row dependency for a COSTING_SHEET_ID, SOURCE_ROW_ID, TARGET_ROW_ID
	 */

    this.removeDependecyIfExists = async function (oRecord, sMasterDataDate) {
        var sTableName = Resources[sCostingSheetRowDependencies].dbobjects.plcTable;

        var aValues = [];
        var aStmtBuilder = [];

        aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE COSTING_SHEET_ID = ? AND SOURCE_ROW_ID = ? AND TARGET_ROW_ID = ? AND _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
        aValues.push(oRecord.COSTING_SHEET_ID);
        aValues.push(oRecord.SOURCE_ROW_ID);
        aValues.push(oRecord.TARGET_ROW_ID);
        hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    };

    /**
	 * Invalidates a costing sheet row text for a COSTING_SHEET_ID, COSTING_SHEET_ROW_ID, LANGUAGE
	 */
    this.removeTextIfExists = async function (oRecord, sMasterDataDate) {
        var sTableName = Resources[sCostingSheetRow].dbobjects.plcTextTable;
        var aValues = [];
        var aStmtBuilder = [];

        aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE COSTING_SHEET_ID = ? and COSTING_SHEET_ROW_ID = ? and LANGUAGE = ? and _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
        aValues.push(oRecord.COSTING_SHEET_ID);
        aValues.push(oRecord.COSTING_SHEET_ROW_ID);
        aValues.push(oRecord.LANGUAGE);
        hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    };

    this.validateFormulaString = async function () {

        var checkFormulaProcedure = dbConnection.loadProcedure(Procedures.checkFormula);
        var result = checkFormulaProcedure();
        if (_.isArray(result.ERRORS) && result.ERRORS.length > 0) {
            var formulaUsed = {};
            var arrayOfErrors = [];
            formulaUsed.FORMULA_ERROR = JSON.parse('{' + result.ERRORS[0].ERROR_DETAILS.replace(/'/g, '"') + '}');

            var oMessageDetails = new MessageDetails();
            oMessageDetails.addFormulaObjs(formulaUsed);

            for (let key in formulaUsed.FORMULA_ERROR) {
                if (formulaUsed.FORMULA_ERROR.hasOwnProperty(key)) {
                    arrayOfErrors.push(`'${ key }' = '${ formulaUsed.FORMULA_ERROR[key] }'`);
                }
            }
            ;
            var resultingErrors = arrayOfErrors.join(',');

            const sLogMessage = `Costing sheet overhead row formula has errors, see details ${ resultingErrors }`;
            $.trace.error(sLogMessage);
            throw new PlcException(FormulaInterpreterError[result.ERRORS[0].ERROR_CODE], sLogMessage, oMessageDetails);
        }
    };

    /**
	 * Update data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of "COSTING_SHEET_ENTITIES","COSTING_SHEET_TEXT_ENTITIES","COSTING_SHEET_ROWS_ENTITIES",
	 * "COSTING_SHEET_ROWS_TEXT_ENTITIES","COSTING_SHEET_ROWS_BASE_ENTITIES","COSTING_SHEET_ROWS_BASE_TEXT_ENTITIES","COSTING_SHEET_ROWS_BASE_ROWS_ENTITIES",
	 * "COSTING_SHEET_ROWS_OVERHEAD_ENTITIES","COSTING_SHEET_ROWS_OVERHEAD_TEXT_ENTITIES","COSTING_SHEET_ROWS_OVERHEAD_ROWS_ENTITIES","COSTING_SHEET_ROWS_DEPENDENCIES_ENTITIES"
	 * @returns {object}  oResult     - updated entries / errors
	 */
    this.update = async function (oBatchItems, sMasterDataDate) {

        var oResult = initResults();

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheetRow, sCostingSheetRow, null);
        }

        var aCostingSheetOverheadRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES];
        _.each(aCostingSheetOverheadRowItems, async function (oRecord) {
            try {
                let oCostingSheetOverheadRowFormulaRecord;

                if (helpers.isNullOrUndefined(oRecord.FORMULA_ID) && helpers.isNullOrUndefined(oRecord.FORMULA_STRING) && helpers.isNullOrUndefined(oRecord.FORMULA_DESCRIPTION) && helpers.isNullOrUndefined(oRecord.OVERHEAD_CUSTOM)) {

                    that.deleteCostingSheetOverheadRowFormula(oRecord);

                } else {

                    let dbFormulaId = that.getCostingSheetOverheadRowFormulaId(oRecord);
                    if (dbFormulaId != oRecord.FORMULA_ID) {
                        const sLogMessage = `Formula id is not found`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
                    }

                    oCostingSheetOverheadRowFormulaRecord = {
                        FORMULA_STRING: oRecord.FORMULA_STRING,
                        FORMULA_DESCRIPTION: oRecord.FORMULA_DESCRIPTION,
                        FORMULA_ID: oRecord.FORMULA_ID,
                        OVERHEAD_CUSTOM: oRecord.OVERHEAD_CUSTOM
                    };

                    if (!helpers.isNullOrUndefined(oCostingSheetOverheadRowFormulaRecord.OVERHEAD_CUSTOM)) {
                        that.checkOverheadCustomField(oRecord);
                    }

                    if (helpers.isNullOrUndefined(oRecord.FORMULA_ID)) {

                        oRecord.FORMULA_ID = that.helper.getNextSequenceID(Sequences.costing_sheet_overhead_row_formula);
                        oCostingSheetOverheadRowFormulaRecord.FORMULA_ID = oRecord.FORMULA_ID;
                        that.insertCostingSheetOverheadRowFormula(oCostingSheetOverheadRowFormulaRecord);
                    } else {

                        that.updateCostingSheetOverheadRowFormula(oCostingSheetOverheadRowFormulaRecord);
                    }
                }

                let oResultUpdate = that.updateCostingSheetOverheadRowRow(_.omit(oRecord, [
                    'FORMULA_STRING',
                    'FORMULA_DESCRIPTION',
                    'OVERHEAD_CUSTOM'
                ]), sMasterDataDate);

                if (!helpers.isNullOrUndefined(oCostingSheetOverheadRowFormulaRecord) && !helpers.isNullOrUndefined(oCostingSheetOverheadRowFormulaRecord.FORMULA_STRING)) {
                    that.validateFormulaString();
                }
                _.extend(oResultUpdate, oCostingSheetOverheadRowFormulaRecord);

                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES].push(oResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aCostingSheetOverheadItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES];
        _.each(aCostingSheetOverheadItems, async function (oRecord) {
            try {
                var oResultUpdate = that.updateCostingSheetOverheadRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES].push(oResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aCostingSheetRowBaseRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES];
        _.each(aCostingSheetRowBaseRowItems, async function (oRecord) {
            try {
                var oResultUpdate = that.updateCostingSheetBaseRowRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES].push(oResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aCostingSheetRowBaseItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES];
        _.each(aCostingSheetRowBaseItems, async function (oRecord) {
            try {
                var oResultUpdate = that.updateCostingSheetBaseRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES].push(oResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                apiHelpers.checkColumns(oRecord, aMetadataFields);
                var oMainResultUpdate = that.updateCostingSheetRowRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES].push(oMainResultUpdate);
                if (!_.isEmpty(aFoundPlcRecordsAccountGroup)) {
                    oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].push(aFoundPlcRecordsAccountGroup);
                }
                that.removeAllDependeciesforCostingSheetRow(oRecord, sMasterDataDate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                that.removeTextIfExists(oRecord, sMasterDataDate);
                var oTextResultUpdate = that.insertCostingSheetRowTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES].push(oTextResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aBatchDepItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = [];
        _.each(aBatchDepItems, async function (oRecord) {
            try {
                that.removeDependecyIfExists(oRecord, sMasterDataDate);
                var oDependenciesResultInsert = that.insertCostingSheetRowDependenciesRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES].push(oDependenciesResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        return oResult;

    };

    /**
	 * Update row
	 *
	 * @param {object} oCostingSheetOverheadRow - update entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.updateCostingSheetOverheadRowRow = async function (oCostingSheetOverheadRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetOverheadRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_OVERHEAD_ROW_ID',
                'COSTING_SHEET_OVERHEAD_ID'
            ]
        };

        var oResult = apiHelpers.updateRow(oCostingSheetOverheadRow, sMasterDataDate, oConfiguration, hQuery, this.helper);

        this.checkReferenceObjectsCostingSheetOverheadRow(oCostingSheetOverheadRow, sMasterDataDate);

        return oResult;

    };

    /**
	 * Update row
	 *
	 * @param {object} oCostingSheetOverhead - update entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.updateCostingSheetOverheadRow = async function (oCostingSheetOverhead, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetOverhead,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_OVERHEAD_ID']
        };

        var oResult = apiHelpers.updateRow(oCostingSheetOverhead, sMasterDataDate, oConfiguration, hQuery, this.helper);

        return oResult;

    };

    /**
	 * Update row
	 *
	 * @param {object} oCostingSheetBaseRow - update entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.updateCostingSheetBaseRowRow = async function (oCostingSheetBaseRow, sMasterDataDate) {
        //item_category_id is not taken into consideration even if it is part of the key
        //there can only be 1 valid version for a costing_sheet_base_id in the t_costing_sheet_base_row table
        var oConfiguration = {
            sObjectName: sCostingSheetBaseRow,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        var oResult = apiHelpers.updateRow(oCostingSheetBaseRow, sMasterDataDate, oConfiguration, hQuery, this.helper);

        return oResult;

    };

    /**
	 * Update row
	 *
	 * @param {object} oCostingSheetBase - update entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.updateCostingSheetBaseRow = async function (oCostingSheetBase, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetBase,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        var oResult = apiHelpers.updateRow(oCostingSheetBase, sMasterDataDate, oConfiguration, hQuery, this.helper);

        return oResult;

    };

    /**
	 * Update row
	 *
	 * @param {object} oCostingSheetRow - deleted entry
	 *        E.g: {,
                         "COSTING_SHEET_ROW_ID": "MEK",
                         "COSTING_SHEET_ID": "COGS",
                         "_VALID_FROM": "2015-03-25T11:13:58.315Z"
                      }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.updateCostingSheetRowRow = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ],
            aFieldsNotNull: ['COSTING_SHEET_ROW_TYPE']
        };

        if (!helpers.isNullOrUndefined(oCostingSheetRow.COSTING_SHEET_ROW_TYPE) && oCostingSheetRow.COSTING_SHEET_ROW_TYPE === 1) {
//Base as Account Group
            oConfiguration.aFieldsNotNull.push('ACCOUNT_GROUP_AS_BASE_ID');
        }

        await checkIfBaseRowsUpdateReadOnlyFields(oCostingSheetRow);


        var iRowType = oCostingSheetRow.COSTING_SHEET_ROW_TYPE;
        if (!helpers.isNullOrUndefined(iRowType) && (iRowType === 1 || iRowType === 2)) {
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL = 1;
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL2 = 1;
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL3 = 1;
        }

        var oResult = apiHelpers.updateRow(oCostingSheetRow, sMasterDataDate, oConfiguration, hQuery, this.helper);

        this.checkReferenceObjectsCostingSheetRow(oCostingSheetRow, sMasterDataDate);

        return oResult;

    };






    async function checkIfBaseRowsUpdateReadOnlyFields(oCostingSheetRow) {


        var sCostingSheetRowType = oCostingSheetRow.COSTING_SHEET_ROW_TYPE;
        if (!helpers.isNullOrUndefined(sCostingSheetRowType) && (sCostingSheetRowType === 1 || sCostingSheetRowType === 2)) {

            var aReadOnlyColumnsForBase = [
                'IS_RELEVANT_FOR_TOTAL',
                'IS_RELEVANT_FOR_TOTAL2',
                'IS_RELEVANT_FOR_TOTAL3'
            ];
            var aInvalidProperties = _.keys(_.pick(oCostingSheetRow, aReadOnlyColumnsForBase));
            if (aInvalidProperties.length) {
                var aInvalidColumns = [];
                aInvalidProperties.forEach(prop => aInvalidColumns.push({ 'columnId': prop }));
                const sLogMessage = `IS_RELEVANT_FOR_TOTALS fields for type base are read-only`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                oMessageDetails.validationObj = {
                    'columnIds': aInvalidColumns,
                    'validationInfoCode': ValidationInfoCode.READONLY_FIELD_ERROR
                };
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }
        }

    }







    this.checkReferenceObjectsCostingSheetRow = function (oCostingSheetRow, sMasterDataDate) {

        this.checkReferenceObjectsCostingSheetBase(oCostingSheetRow, sMasterDataDate);
        this.checkReferenceObjectsCostingSheetOverhead(oCostingSheetRow, sMasterDataDate);
        this.checkReferenceObjectsAccountGroup(oCostingSheetRow, sMasterDataDate);

    };







    this.checkReferenceObjectsCostingSheetOverheadRow = async function (oCostingSheetOverheadRow, sMasterDataDate) {

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.CONTROLLING_AREA_ID) && oCostingSheetOverheadRow.CONTROLLING_AREA_ID !== '') {

            const aFieldsMainPlcTable = ['CONTROLLING_AREA_ID'];
            const aKeyFieldsRefObjectPlcTable = ['CONTROLLING_AREA_ID'];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oControllingArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oControllingArea, sMasterDataDate, BusinessObjectTypes.ControllingArea, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.COMPANY_CODE_ID) && oCostingSheetOverheadRow.COMPANY_CODE_ID !== '') {

            const aFieldsMainPlcTable = ['COMPANY_CODE_ID'];
            const aKeyFieldsRefObjectPlcTable = ['COMPANY_CODE_ID'];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oCompanyCode = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oCompanyCode, sMasterDataDate, BusinessObjectTypes.CompanyCode, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.BUSINESS_AREA_ID) && oCostingSheetOverheadRow.BUSINESS_AREA_ID !== '') {

            const aFieldsMainPlcTable = ['BUSINESS_AREA_ID'];
            const aKeyFieldsRefObjectPlcTable = ['BUSINESS_AREA_ID'];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oBusinessArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oBusinessArea, sMasterDataDate, BusinessObjectTypes.BusinessArea, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.PROFIT_CENTER_ID) && oCostingSheetOverheadRow.PROFIT_CENTER_ID !== '') {

            const aFieldsMainPlcTable = [
                'PROFIT_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aKeyFieldsRefObjectPlcTable = [
                'PROFIT_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oProfitCenter = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oProfitCenter, sMasterDataDate, BusinessObjectTypes.ProfitCenter, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.PLANT_ID) && oCostingSheetOverheadRow.PLANT_ID !== '') {

            const aFieldsMainPlcTable = ['PLANT_ID'];
            const aKeyFieldsRefObjectPlcTable = ['PLANT_ID'];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oPlant = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oPlant, sMasterDataDate, BusinessObjectTypes.Plant, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.ACTIVITY_TYPE_ID) && oCostingSheetOverheadRow.ACTIVITY_TYPE_ID !== '') {

            const aFieldsMainPlcTable = [
                'ACTIVITY_TYPE_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aKeyFieldsRefObjectPlcTable = [
                'ACTIVITY_TYPE_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oActivityType = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oActivityType, sMasterDataDate, BusinessObjectTypes.ActivityType, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.COST_CENTER_ID) && oCostingSheetOverheadRow.COST_CENTER_ID !== '') {

            const aFieldsMainPlcTable = [
                'COST_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aKeyFieldsRefObjectPlcTable = [
                'COST_CENTER_ID',
                'CONTROLLING_AREA_ID'
            ];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oCostCenter = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oCostCenter, sMasterDataDate, BusinessObjectTypes.CostCenter, hQuery);
        }

        if (!helpers.isNullOrUndefined(oCostingSheetOverheadRow.WORK_CENTER_ID) && oCostingSheetOverheadRow.WORK_CENTER_ID !== '') {

            const aFieldsMainPlcTable = [
                'WORK_CENTER_ID',
                'PLANT_ID'
            ];
            const aKeyFieldsRefObjectPlcTable = [
                'WORK_CENTER_ID',
                'PLANT_ID'
            ];
            const aFieldsValuesMainPlcTable = apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oCostingSheetOverheadRow);
            const oWorkCenter = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
            apiHelpers.checkObjectExists(oWorkCenter, sMasterDataDate, BusinessObjectTypes.WorkCenter, hQuery);
        }
    };







    this.checkReferenceObjectsCostingSheetBase = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ]
        };

        var oConfigurationBase = {
            sObjectName: sCostingSheetBase,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        if (!helpers.isNullOrUndefined(oCostingSheetRow.COSTING_SHEET_BASE_ID)) {
            var aFieldsValuesCostingSheetBasePlcTable = apiHelpers.getColumnKeyValues(oConfigurationBase.aPartialKeyPlcTableColumns, oCostingSheetRow);
            var aFoundPlcRecords = apiHelpers.findValidEntriesInTable(CostingSheetResources[sCostingSheetBase].dbobjects.plcTable, oConfigurationBase.aPartialKeyPlcTableColumns, aFieldsValuesCostingSheetBasePlcTable, sMasterDataDate, hQuery);
            if (aFoundPlcRecords.length === 0) {
                const sLogMessage = `No costing sheet base found in t_costing_sheet_base.`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            }
        }

    };







    this.checkReferenceObjectsCostingSheetOverhead = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ]
        };

        var oConfigurationOverhead = {
            sObjectName: sCostingSheetOverhead,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_OVERHEAD_ID'],
            aOtherNonTemporaryPlcTableColumns: [
                'CREDIT_ACCOUNT_ID',
                'CONTROLLING_AREA_ID'
            ]
        };

        var oConfigurationAccount = {
            sObjectName: sAccount,
            aPartialKeyPlcTableColumns: [
                'ACCOUNT_ID',
                'CONTROLLING_AREA_ID'
            ]
        };

        let aFieldsValuesCostingSheetOverheadPlcTable;
        let aFoundPlcRecords;
        var oMessageDetails = new MessageDetails();
        oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
        if (!helpers.isNullOrUndefined(oCostingSheetRow.COSTING_SHEET_OVERHEAD_ID)) {
            aFieldsValuesCostingSheetOverheadPlcTable = apiHelpers.getColumnKeyValues(oConfigurationOverhead.aPartialKeyPlcTableColumns, oCostingSheetRow);
            aFoundPlcRecords = apiHelpers.findValidEntriesInTable(CostingSheetResources[sCostingSheetOverhead].dbobjects.plcTable, oConfigurationOverhead.aPartialKeyPlcTableColumns, aFieldsValuesCostingSheetOverheadPlcTable, sMasterDataDate, hQuery);
            if (aFoundPlcRecords.length === 0) {
                const sLogMessage = `No costing sheet overhead found in t_costing_sheet_overhead`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            }
        }

        if (!helpers.isNullOrUndefined(oCostingSheetRow.CREDIT_ACCOUNT_ID)) {
            aFieldsValuesCostingSheetOverheadPlcTable = apiHelpers.getColumnKeyValues(oConfigurationOverhead.aOtherNonTemporaryPlcTableColumns, oCostingSheetRow);
            aFoundPlcRecords = apiHelpers.findValidEntriesInTable(Resources[sAccount].dbobjects.plcTable, oConfigurationAccount.aPartialKeyPlcTableColumns, aFieldsValuesCostingSheetOverheadPlcTable, sMasterDataDate, hQuery);
            if (aFoundPlcRecords.length === 0) {
                const sLogMessage = `No valid account found in t_account`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            }
        }
    };







    this.checkReferenceObjectsAccountGroup = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: ['ACCOUNT_GROUP_AS_BASE_ID']
        };

        var oConfigurationAccountGroup = {
            sObjectName: sAccountGroup,
            aPartialKeyPlcTableColumns: ['ACCOUNT_GROUP_ID']
        };

        if (!helpers.isNullOrUndefined(oCostingSheetRow.ACCOUNT_GROUP_AS_BASE_ID)) {
            var aFieldsValuesCostingSheetAccountGroupPlcTable = apiHelpers.getColumnKeyValues(oConfiguration.aPartialKeyPlcTableColumns, oCostingSheetRow);
            var aFoundPlcRecords = apiHelpers.findValidEntriesInTable(Resources[sAccountGroup].dbobjects.plcTable, oConfigurationAccountGroup.aPartialKeyPlcTableColumns, aFieldsValuesCostingSheetAccountGroupPlcTable, sMasterDataDate, hQuery);
            if (aFoundPlcRecords.length === 0) {
                const sLogMessage = `No account group base found in t_account_group`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                oMessageDetails.businessObj = sAccountGroup;
                oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
            } else {
                aFoundPlcRecordsAccountGroup = aFoundPlcRecords[0];
            }
        }
    };








    async function getControllingAreaId(oBatchItems, oRecord, sMasterDataDate) {
        const oCostingSheetRow = _.find(oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES], costingSheetRow => {
            return costingSheetRow.COSTING_SHEET_OVERHEAD_ID === oRecord.COSTING_SHEET_OVERHEAD_ID;
        });

        const oCostingSheet = dbConnection.executeQuery(`select CONTROLLING_AREA_ID from "sap.plc.db::basis.t_costing_sheet" where COSTING_SHEET_ID = '${ oCostingSheetRow.COSTING_SHEET_ID }' and (_VALID_TO is null or _VALID_TO > '${ sMasterDataDate }')`);
        oRecord.CONTROLLING_AREA_ID = oCostingSheet.length > 0 && !helpers.isNullOrUndefined(oCostingSheet[0].CONTROLLING_AREA_ID) ? oCostingSheet[0].CONTROLLING_AREA_ID : null;
        return oRecord;
    }







    async function checkTotalFlagsForDependencies(aCostingSheetRowsResults, aCostingSheetRowDependencies) {
        var aCostingSheetRowsResultMap = new Map();

        aCostingSheetRowsResults.forEach(row => {
            if (aCostingSheetRowsResultMap.has(row.COSTING_SHEET_ID)) {
                var aRows = aCostingSheetRowsResultMap.get(row.COSTING_SHEET_ID);
                aRows.push(row);
                aCostingSheetRowsResultMap.set(row.COSTING_SHEET_ID, aRows);
            } else {
                aCostingSheetRowsResultMap.set(row.COSTING_SHEET_ID, [row]);
            }
        });

        aCostingSheetRowDependencies.forEach(oDependecy => {
            const oSourceRow = aCostingSheetRowsResultMap.get(oDependecy.COSTING_SHEET_ID).find(row => row.COSTING_SHEET_ROW_ID === oDependecy.SOURCE_ROW_ID);
            const iSourceMask = (oSourceRow.IS_RELEVANT_FOR_TOTAL << 3) + (oSourceRow.IS_RELEVANT_FOR_TOTAL2 << 2) + oSourceRow.IS_RELEVANT_FOR_TOTAL3;
            const oTargetRow = aCostingSheetRowsResultMap.get(oDependecy.COSTING_SHEET_ID).find(row => row.COSTING_SHEET_ROW_ID === oDependecy.TARGET_ROW_ID);
            const iTargetMask = (oTargetRow.IS_RELEVANT_FOR_TOTAL << 3) + (oTargetRow.IS_RELEVANT_FOR_TOTAL2 << 2) + oTargetRow.IS_RELEVANT_FOR_TOTAL3;

            if ((iSourceMask & iTargetMask) !== iSourceMask) {
                const sLogMessage = `Can not enable IS_RELEVANT_FOR_TOTAL fields if the referenced entities have them disabled`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                var oColumnsIds = [];
                if (oSourceRow.IS_RELEVANT_FOR_TOTAL === 1 && oTargetRow.IS_RELEVANT_FOR_TOTAL === 0) {
                    oColumnsIds.push({ 'columnId': 'IS_RELEVANT_FOR_TOTAL' });
                }
                if (oSourceRow.IS_RELEVANT_FOR_TOTAL2 === 1 && oTargetRow.IS_RELEVANT_FOR_TOTAL2 === 0) {
                    oColumnsIds.push({ 'columnId': 'IS_RELEVANT_FOR_TOTAL2' });
                }
                if (oSourceRow.IS_RELEVANT_FOR_TOTAL3 === 1 && oTargetRow.IS_RELEVANT_FOR_TOTAL3 === 0) {
                    oColumnsIds.push({ 'columnId': 'IS_RELEVANT_FOR_TOTAL3' });
                }
                oMessageDetails.validationObj = {
                    'columnIds': oColumnsIds,
                    'validationInfoCode': ValidationInfoCode.VALUE_ERROR
                };
                oMessageDetails.record = oSourceRow;
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage, oMessageDetails);
            }
        });
    }












    async function checkIfRowDependenciesHaveValidTotalFields(oBatchItemsInsert, oBatchItemsUpdate, sMasterDataDate, oResult) {

        var aCostingSheetRowDependencies = [];
        if (!helpers.isNullOrUndefined(oBatchItemsInsert) && !helpers.isNullOrUndefined(oBatchItemsInsert.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES)) {
            aCostingSheetRowDependencies = oBatchItemsInsert.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES;
        }
        if (!helpers.isNullOrUndefined(oBatchItemsUpdate) && !helpers.isNullOrUndefined(oBatchItemsUpdate.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES)) {
            aCostingSheetRowDependencies = aCostingSheetRowDependencies.concat(oBatchItemsUpdate.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES);
        }
        _.uniqWith(aCostingSheetRowDependencies, _.isEqual);

        if (aCostingSheetRowDependencies.length) {
            var sInClause = aCostingSheetRowDependencies.map(oDependecy => `('${ oDependecy.COSTING_SHEET_ID }','${ oDependecy.SOURCE_ROW_ID }'),('${ oDependecy.COSTING_SHEET_ID }','${ oDependecy.TARGET_ROW_ID }')`).join(',');
            var sStmt = `
				SELECT COSTING_SHEET_ID, COSTING_SHEET_ROW_ID, IS_RELEVANT_FOR_TOTAL, IS_RELEVANT_FOR_TOTAL2, IS_RELEVANT_FOR_TOTAL3 
				FROM "${ Tables.costing_sheet_row }"
				WHERE (COSTING_SHEET_ID, COSTING_SHEET_ROW_ID) IN (${ sInClause })
					AND (_VALID_TO is null OR _VALID_TO > ?)
					AND _VALID_FROM <= ?
			`;

            var aCostingSheetRowsResults = dbConnection.executeQuery(sStmt, sMasterDataDate, sMasterDataDate);

            try {
                await checkTotalFlagsForDependencies(aCostingSheetRowsResults, aCostingSheetRowDependencies);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(e.details.record, BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        }

        if (!helpers.isNullOrUndefined(oBatchItemsUpdate) && !helpers.isNullOrUndefined(oBatchItemsUpdate.COSTING_SHEET_ROW_ENTITIES)) {

            var sInClause = oBatchItemsUpdate.COSTING_SHEET_ROW_ENTITIES.map(row => `('${ row.COSTING_SHEET_ID }','${ row.COSTING_SHEET_ROW_ID }')`).join(',');

            var sStmtDependencies = `
				SELECT COSTING_SHEET_ID, SOURCE_ROW_ID, TARGET_ROW_ID
				FROM "${ Tables.costing_sheet_row_dependencies }"
				WHERE ((COSTING_SHEET_ID, SOURCE_ROW_ID) IN (${ sInClause })
					OR (COSTING_SHEET_ID, TARGET_ROW_ID) in (${ sInClause }))
					AND (_VALID_TO is null OR _VALID_TO > ?)
					AND _VALID_FROM <= ?
			`;

            var aCostingSheetRowDependencies = dbConnection.executeQuery(sStmtDependencies, sMasterDataDate, sMasterDataDate);

            var aUniqueRowsFromDependencies = new Set();
            aCostingSheetRowDependencies.forEach(oDependecy => {
                aUniqueRowsFromDependencies.add(`('${ oDependecy.COSTING_SHEET_ID }','${ oDependecy.SOURCE_ROW_ID }')`);
                aUniqueRowsFromDependencies.add(`('${ oDependecy.COSTING_SHEET_ID }','${ oDependecy.TARGET_ROW_ID }')`);
            });

            var sInClauseDependecies = Array.from(aUniqueRowsFromDependencies).join(',');

            if (sInClauseDependecies !== '') {
                var sStmtRows = `
					SELECT COSTING_SHEET_ID, COSTING_SHEET_ROW_ID, IS_RELEVANT_FOR_TOTAL, IS_RELEVANT_FOR_TOTAL2, IS_RELEVANT_FOR_TOTAL3
					FROM "${ Tables.costing_sheet_row }"
					WHERE (COSTING_SHEET_ID, COSTING_SHEET_ROW_ID) IN (${ sInClauseDependecies })
						AND (_VALID_TO is null OR _VALID_TO > ?)
						AND _VALID_FROM <= ?
				`;

                var aCostingSheetRowsResults = dbConnection.executeQuery(sStmtRows, sMasterDataDate, sMasterDataDate);

                try {
                    await checkTotalFlagsForDependencies(aCostingSheetRowsResults, aCostingSheetRowDependencies);
                } catch (e) {
                    oResult.hasErrors = true;
                    apiHelpers.createResponse(e.details.record, BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES, e, MessageOperation.UPDATE, oResult);
                }
            }
        }
    }
    ;











    this.checkIfTotalFieldsAreValidForCostingSheetRows = async function (oBatchItemsInsert, oBatchItemsUpdate, sMasterDataDate) {

        var oResult = initResults();
        await checkIfRowDependenciesHaveValidTotalFields(oBatchItemsInsert, oBatchItemsUpdate, sMasterDataDate, oResult);

        return oResult;
    };







    this.insert = async function (oBatchItems, sMasterDataDate) {

        var oResult = initResults();

        if (aMetadataFields === null) {
            aMetadataFields = this.metadata.getMetadataFields(sCostingSheetRow, sCostingSheetRow, null);
        }

        var aCostingSheetOverheadItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES];
        _.each(aCostingSheetOverheadItems, async function (oRecord) {
            try {
                if (!helpers.isNullOrUndefined(oRecord.CREDIT_ACCOUNT_ID)) {
                    oRecord = await getControllingAreaId(oBatchItems, oRecord, sMasterDataDate);
                }
                var oResultInsert = that.insertCostingSheetOverheadRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES].push(oResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aCostingSheetOverheadRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES];
        _.each(aCostingSheetOverheadRowItems, async function (oRecord) {
            try {
                let iOldCSROldId = oRecord.COSTING_SHEET_OVERHEAD_ROW_ID;
                let iOldCSOId = 0;
                if (oRecord.COSTING_SHEET_OVERHEAD_ID < 0) {
                    iOldCSOId = oRecord.COSTING_SHEET_OVERHEAD_ID;
                    oRecord.COSTING_SHEET_OVERHEAD_ID = oCostingSheetOverheadId[oRecord.COSTING_SHEET_OVERHEAD_ID] != null ? oCostingSheetOverheadId[oRecord.COSTING_SHEET_OVERHEAD_ID] : null;
                }

                let oCostingSheetOverheadRowFormulaResultRecord;
                if (!helpers.isNullOrUndefined(oRecord.FORMULA_STRING) || !helpers.isNullOrUndefined(oRecord.OVERHEAD_CUSTOM)) {
                    oRecord.FORMULA_ID = that.helper.getNextSequenceID(Sequences.costing_sheet_overhead_row_formula);
                    if (!helpers.isNullOrUndefined(oRecord.OVERHEAD_CUSTOM)) {

                        that.checkOverheadCustomField(oRecord);

                    }
                    oCostingSheetOverheadRowFormulaResultRecord = {
                        FORMULA_STRING: oRecord.FORMULA_STRING,
                        FORMULA_DESCRIPTION: oRecord.FORMULA_DESCRIPTION,
                        OVERHEAD_CUSTOM: oRecord.OVERHEAD_CUSTOM,
                        FORMULA_ID: oRecord.FORMULA_ID
                    };
                    that.insertCostingSheetOverheadRowFormula(oCostingSheetOverheadRowFormulaResultRecord);
                }
                let oResultInsert = that.insertCostingSheetOverheadRowRow(_.omit(oRecord, [
                    'FORMULA_STRING',
                    'FORMULA_DESCRIPTION',
                    'OVERHEAD_CUSTOM'
                ]), sMasterDataDate);

                if (!helpers.isNullOrUndefined(oRecord.FORMULA_STRING)) {
                    that.validateFormulaString();
                }
                _.extend(oResultInsert, oCostingSheetOverheadRowFormulaResultRecord);

                oResultInsert.COSTING_SHEET_OVERHEAD_ROW_OLD_ID = iOldCSROldId;
                if (iOldCSOId != 0) {
                    oResultInsert.COSTING_SHEET_OVERHEAD_OLD_ID = iOldCSOId;
                }

                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES].push(oResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aCostingSheetRowBaseItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES];
        _.each(aCostingSheetRowBaseItems, async function (oRecord) {
            try {
                var oResultInsert = that.insertCostingSheetBaseRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES].push(oResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES, e, MessageOperation.UPDATE, oResult);
            }
        });

        var aCostingSheetRowBaseRowItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES];
        _.each(aCostingSheetRowBaseRowItems, async function (oRecord) {
            try {
                oRecord.COSTING_SHEET_BASE_ID = oCostingSheetRowBaseId[oRecord.COSTING_SHEET_BASE_ID] != null ? oCostingSheetRowBaseId[oRecord.COSTING_SHEET_BASE_ID] : null;

                var oResultInsert = that.insertCostingSheetBaseRowRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES].push(oResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchMainItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                apiHelpers.checkColumns(oRecord, aMetadataFields);
                if (oCostingSheetRowBaseId[oRecord.COSTING_SHEET_BASE_ID] != null) {
                    oRecord.COSTING_SHEET_BASE_ID = oCostingSheetRowBaseId[oRecord.COSTING_SHEET_BASE_ID];
                }
                if (oCostingSheetOverheadId[oRecord.COSTING_SHEET_OVERHEAD_ID] != null) {
                    oRecord.COSTING_SHEET_OVERHEAD_ID = oCostingSheetOverheadId[oRecord.COSTING_SHEET_OVERHEAD_ID];
                }

                var oMainResultInsert = that.insertCostingSheetRowRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES].push(oMainResultInsert);
                if (!_.isEmpty(aFoundPlcRecordsAccountGroup)) {
                    oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].push(aFoundPlcRecordsAccountGroup);
                }
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                var oTextResultInsert = that.insertCostingSheetRowTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES].push(oTextResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        var aBatchDepItems = oBatchItems[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = [];
        _.each(aBatchDepItems, async function (oRecord) {
            try {
                var oDependenciesResultInsert = that.insertCostingSheetRowDependenciesRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES].push(oDependenciesResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES, e, MessageOperation.CREATE, oResult);
            }
        });

        return oResult;

    };













    this.insertCostingSheetOverheadRowRow = async function (oCostingSheetOverheadRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetOverheadRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_OVERHEAD_ROW_ID',
                'COSTING_SHEET_OVERHEAD_ID'
            ]
        };

        var sPlcTableName = CostingSheetResources[sCostingSheetOverheadRow].dbobjects.plcTable;
        var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;


        apiHelpers.checkMandatoryProperties(oCostingSheetOverheadRow, aPartialKeyPlcTableColumns);

        var iOverheadRowId = this.helper.getNextSequenceID(Sequences.costing_sheet_overhead_row);

        this.helper.setHQuery(hQuery);
        var aExcludeProperies = [];
        aExcludeProperies.push('COSTING_SHEET_OVERHEAD_ROW_ID');
        aExcludeProperies.push('_VALID_FROM');
        aExcludeProperies.push('_VALID_TO');
        aExcludeProperies.push('_SOURCE');

        var oGeneratedValues = {
            'COSTING_SHEET_OVERHEAD_ROW_ID': iOverheadRowId,
            '_VALID_FROM': sMasterDataDate,
            '_VALID_TO': null,
            '_SOURCE': aSource[0],
            '_CREATED_BY': $.getPlcUsername()
        };

        var oSettings = {
            TABLE: sPlcTableName,
            PROPERTIES_TO_EXCLUDE: aExcludeProperies,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        oCostingSheetOverheadRowId[oCostingSheetOverheadRow.COSTING_SHEET_OVERHEAD_ROW_ID] = iOverheadRowId;

        var oResult = this.helper.insertNewEntity(oCostingSheetOverheadRow, oSettings);
        this.checkReferenceObjectsCostingSheetOverheadRow(oResult, sMasterDataDate);

        return oResult;
    };





    this.checkOverheadCustomField = async function (oRecord) {

        let aMetadataCustomFieldResult = {};
        let aCustomFieldFormulas = [];

        aMetadataCustomFieldResult = this.metadata.getMetadataFields(sCostingSheetOverheadCustomField, sCostingSheetOverheadCustomField, oRecord.OVERHEAD_CUSTOM, true)[0];
        if (helpers.isNullOrUndefined(aMetadataCustomFieldResult)) {
            const sClientMsg = 'Custom field entity not found!';
            const sServerMsg = `${ sClientMsg } Costing sheet overhead id id: ${ oRecord.COSTING_SHEET_OVERHEAD_ID }, OVERHEAD_CUSTOM id: ${ oRecord.OVERHEAD_CUSTOM }.`;
            $.trace.error(sServerMsg);
            let oMessageDetails = new MessageDetails();
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }
        if (aMetadataCustomFieldResult.SEMANTIC_DATA_TYPE !== 'Decimal') {
            const sClientMsg = 'Custom field entity used as an overhead custom field must be of type decimal!';
            const sServerMsg = `${ sClientMsg } Costing sheet overhead id id: ${ oRecord.COSTING_SHEET_OVERHEAD_ID }, OVERHEAD_CUSTOM id: ${ oRecord.OVERHEAD_CUSTOM }.`;
            $.trace.error(sServerMsg);
            let oMessageDetails = new MessageDetails();
            throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR, sClientMsg, oMessageDetails);
        }

        if (!helpers.isNullOrUndefined(aMetadataCustomFieldResult.REF_UOM_CURRENCY_COLUMN_ID)) {
            if (!_.isEmpty(aMetadataCustomFieldResult.REF_UOM_CURRENCY_COLUMN_ID)) {
                const sClientMsg = 'Custom field entity used as an overhead custom field can not have a currency or unit of measure assigned to it!';
                const sServerMsg = `${ sClientMsg } Costing sheet overhead id id: ${ oRecord.COSTING_SHEET_OVERHEAD_ID }, OVERHEAD_CUSTOM id: ${ oRecord.OVERHEAD_CUSTOM }.`;
                $.trace.error(sServerMsg);
                let oMessageDetails = new MessageDetails();
                throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR, sClientMsg, oMessageDetails);
            }
        }

        aCustomFieldFormulas = this.metadata.getMetadataFormulas(sCostingSheetOverheadCustomField, sCostingSheetOverheadCustomField, oRecord.OVERHEAD_CUSTOM);
        if (aCustomFieldFormulas.length != 0) {
            const sClientMsg = 'Custom field entity used as an overhead custom field can not have a formula assigned to it!';
            const sServerMsg = `${ sClientMsg } Costing sheet overhead id id: ${ oRecord.COSTING_SHEET_OVERHEAD_ID }, OVERHEAD_CUSTOM id: ${ oRecord.OVERHEAD_CUSTOM }.`;
            $.trace.error(sServerMsg);
            let oMessageDetails = new MessageDetails();
            throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR, sClientMsg, oMessageDetails);
        }

        aMetadataCustomFieldResult = [];
        aCustomFieldFormulas = [];

    };







    this.insertCostingSheetOverheadRowFormula = function (oCostingSheetOverheadRowFormula) {

        const sStmt = `INSERT INTO "${ Tables.costing_sheet_overhead_row_formula }"
			(FORMULA_ID, FORMULA_STRING, FORMULA_DESCRIPTION, OVERHEAD_CUSTOM )
			VALUES (?, ?, ?, ? )`;

        dbConnection.executeUpdate(sStmt, oCostingSheetOverheadRowFormula.FORMULA_ID, oCostingSheetOverheadRowFormula.FORMULA_STRING, oCostingSheetOverheadRowFormula.FORMULA_DESCRIPTION, oCostingSheetOverheadRowFormula.OVERHEAD_CUSTOM);
    };







    this.updateCostingSheetOverheadRowFormula = function (oCostingSheetOverheadRowFormula) {

        const sStmt = `UPDATE "${ Tables.costing_sheet_overhead_row_formula }"
			SET FORMULA_DESCRIPTION = ?, FORMULA_STRING = ?, OVERHEAD_CUSTOM = ?
			WHERE FORMULA_ID = ? `;

        dbConnection.executeUpdate(sStmt, oCostingSheetOverheadRowFormula.FORMULA_DESCRIPTION, oCostingSheetOverheadRowFormula.FORMULA_STRING, oCostingSheetOverheadRowFormula.OVERHEAD_CUSTOM, oCostingSheetOverheadRowFormula.FORMULA_ID);
    };







    this.deleteCostingSheetOverheadRowFormula = function (oCostingSheetOverheadRow) {

        let iCostingSheetOverheadRowFormulaId = that.getCostingSheetOverheadRowFormulaId(oCostingSheetOverheadRow);

        let oCostingSheetOverheadRowFormulaRecord = {
            FORMULA_STRING: null,
            FORMULA_DESCRIPTION: null,
            OVERHEAD_CUSTOM: null,
            FORMULA_ID: iCostingSheetOverheadRowFormulaId
        };
        return that.updateCostingSheetOverheadRowFormula(oCostingSheetOverheadRowFormulaRecord);
    };







    this.deleteCostingSheetOverheadFormulas = function (iCostingSheetOverheadId) {

        const sStmt = `UPDATE "${ Tables.costing_sheet_overhead_row_formula }"
		SET FORMULA_DESCRIPTION  = null, FORMULA_STRING = null, OVERHEAD_CUSTOM = null
		WHERE FORMULA_ID IN 
				(SELECT FORMULA_ID FROM "${ Tables.costing_sheet_overhead_row }"  WHERE
				_VALID_TO IS NULL AND
				COSTING_SHEET_OVERHEAD_ID = ?)`;

        dbConnection.executeUpdate(sStmt, iCostingSheetOverheadId);
    };







    this.getCostingSheetOverheadRowFormulaId = function (oCostingSheetOverheadRow) {

        let sCostingSheetOverheadRowTableName = CostingSheetResources[sCostingSheetOverheadRow].dbobjects.plcTable;

        const sCostingSheetOverheadRowStmt = `SELECT FORMULA_ID FROM "${ sCostingSheetOverheadRowTableName }"  WHERE
			 _VALID_TO IS NULL AND
			 COSTING_SHEET_OVERHEAD_ROW_ID = ? AND
			 COSTING_SHEET_OVERHEAD_ID = ?`;

        return dbConnection.executeQuery(sCostingSheetOverheadRowStmt, oCostingSheetOverheadRow.COSTING_SHEET_OVERHEAD_ROW_ID, oCostingSheetOverheadRow.COSTING_SHEET_OVERHEAD_ID)[0].FORMULA_ID;
    };













    this.insertCostingSheetOverheadRow = async function (oCostingSheetOverhead, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetOverhead,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_OVERHEAD_ID',
                'IS_ROLLED_UP'
            ]
        };

        var sPlcTableName = CostingSheetResources[sCostingSheetOverhead].dbobjects.plcTable;
        var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
        var aPartialKeyPlcTableColumnValues = apiHelpers.getColumnKeyValues(aPartialKeyPlcTableColumns, oCostingSheetOverhead);


        apiHelpers.checkMandatoryProperties(oCostingSheetOverhead, aPartialKeyPlcTableColumns);

        var iOverheadId = this.helper.getNextSequenceID(Sequences.costing_sheet_overhead);

        this.helper.setHQuery(hQuery);
        var aExcludeProperies = [];
        aExcludeProperies.push('_VALID_FROM');
        aExcludeProperies.push('_VALID_TO');
        aExcludeProperies.push('_SOURCE');

        var oGeneratedValues = {
            'COSTING_SHEET_OVERHEAD_ID': iOverheadId,
            '_VALID_FROM': sMasterDataDate,
            '_VALID_TO': null,
            '_SOURCE': aSource[0],
            '_CREATED_BY': $.getPlcUsername()
        };
        var oSettings = {
            TABLE: sPlcTableName,
            PROPERTIES_TO_EXCLUDE: aExcludeProperies,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        oCostingSheetOverheadId[oCostingSheetOverhead.COSTING_SHEET_OVERHEAD_ID] = iOverheadId;

        var oResult = this.helper.insertNewEntity(_.omit(oCostingSheetOverhead, 'CONTROLLING_AREA_ID'), oSettings);
        oResult.CONTROLLING_AREA_ID = !helpers.isNullOrUndefined(oCostingSheetOverhead.CONTROLLING_AREA_ID) ? oCostingSheetOverhead.CONTROLLING_AREA_ID : null;
        this.checkReferenceObjectsCostingSheetOverhead(oResult, sMasterDataDate);

        return oResult;
    };













    this.insertCostingSheetBaseRowRow = async function (oCostingSheetBaseRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetBaseRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_BASE_ID',
                'ITEM_CATEGORY_ID',
                'CHILD_ITEM_CATEGORY_ID'
            ]
        };

        var sPlcTableName = CostingSheetResources[sCostingSheetBaseRow].dbobjects.plcTable;
        var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
        var aPartialKeyPlcTableColumnValues = apiHelpers.getColumnKeyValues(aPartialKeyPlcTableColumns, oCostingSheetBaseRow);

        const oValidItemCategoryIds = that.getItemCategories();


        apiHelpers.checkMandatoryProperties(oCostingSheetBaseRow, aPartialKeyPlcTableColumns);


        var iCategoryId = _.has(oCostingSheetBaseRow, 'ITEM_CATEGORY_ID') ? genericSyntaxValidator.validateValue(oCostingSheetBaseRow.ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : null;
        var iChildCategoryId = _.has(oCostingSheetBaseRow, 'CHILD_ITEM_CATEGORY_ID') ? genericSyntaxValidator.validateValue(oCostingSheetBaseRow.CHILD_ITEM_CATEGORY_ID, 'PositiveInteger', undefined, true) : null;
        if (oValidItemCategoryIds.hasOwnProperty(iChildCategoryId) === false || oValidItemCategoryIds[iChildCategoryId] !== iCategoryId) {
            const sClientMsg = 'Child item category id is not valid';
            const sServerMsg = `${ sClientMsg } Costing sheet base id id: ${ oCostingSheetBaseRow.COSTING_SHEET_BASE_ID }, Child item category id: ${ oCostingSheetBaseRow.CHILD_ITEM_CATEGORY_ID }.`;
            $.trace.error(sServerMsg);
            var oMessageDetails = new MessageDetails();
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
        }

        this.helper.setHQuery(hQuery);
        var aExcludeProperies = [];
        aExcludeProperies.push('_VALID_FROM');
        aExcludeProperies.push('_VALID_TO');
        aExcludeProperies.push('_SOURCE');

        var oGeneratedValues = {
            '_VALID_FROM': sMasterDataDate,
            '_VALID_TO': null,
            '_SOURCE': aSource[0],
            '_CREATED_BY': $.getPlcUsername()
        };

        var oSettings = {
            TABLE: sPlcTableName,
            PROPERTIES_TO_EXCLUDE: aExcludeProperies,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        var oResult = this.helper.insertNewEntity(oCostingSheetBaseRow, oSettings);

        return oResult;

    };













    this.insertCostingSheetBaseRow = async function (oCostingSheetBase, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetBase,
            aPartialKeyPlcTableColumns: ['COSTING_SHEET_BASE_ID']
        };

        var sPlcTableName = CostingSheetResources[sCostingSheetBase].dbobjects.plcTable;
        var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;
        var aPartialKeyPlcTableColumnValues = apiHelpers.getColumnKeyValues(aPartialKeyPlcTableColumns, oCostingSheetBase);


        apiHelpers.checkMandatoryProperties(oCostingSheetBase, aPartialKeyPlcTableColumns);

        var iCostingSheetBaseId = this.helper.getNextSequenceID(Sequences.costing_sheet_base);

        this.helper.setHQuery(hQuery);
        var aExcludeProperies = [];
        aExcludeProperies.push('_VALID_FROM');
        aExcludeProperies.push('_VALID_TO');
        aExcludeProperies.push('_SOURCE');

        var oGeneratedValues = {
            'COSTING_SHEET_BASE_ID': iCostingSheetBaseId,
            '_VALID_FROM': sMasterDataDate,
            '_VALID_TO': null,
            '_SOURCE': aSource[0],
            '_CREATED_BY': $.getPlcUsername()
        };

        var oSettings = {
            TABLE: sPlcTableName,
            PROPERTIES_TO_EXCLUDE: aExcludeProperies,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        oCostingSheetRowBaseId[oCostingSheetBase.COSTING_SHEET_BASE_ID] = iCostingSheetBaseId;
        var oResult = this.helper.insertNewEntity(oCostingSheetBase, oSettings);

        return oResult;
    };













    this.insertCostingSheetRowRow = async function (oCostingSheetRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ],
            aFieldsNotNull: ['COSTING_SHEET_ROW_TYPE']
        };



        if (oCostingSheetRow.COSTING_SHEET_BASE_ID !== undefined && oCostingSheetRow.COSTING_SHEET_OVERHEAD_ID !== undefined || oCostingSheetRow.COSTING_SHEET_OVERHEAD_ID !== undefined && oCostingSheetRow.ACCOUNT_GROUP_AS_BASE_ID !== undefined || oCostingSheetRow.COSTING_SHEET_BASE_ID !== undefined && oCostingSheetRow.ACCOUNT_GROUP_AS_BASE_ID !== undefined) {
            const sLogMessage = `More than one attribue is filled for the row type.`;
            $.trace.error(sLogMessage);
            var oMessageDetails = new MessageDetails();
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        await checkIfBaseRowsUpdateReadOnlyFields(oCostingSheetRow);


        var iRowType = oCostingSheetRow.COSTING_SHEET_ROW_TYPE;
        if (!helpers.isNullOrUndefined(iRowType) && (iRowType === 1 || iRowType === 2)) {
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL = 1;
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL2 = 1;
            oCostingSheetRow.IS_RELEVANT_FOR_TOTAL3 = 1;
        }

        var oResult = apiHelpers.insertRow(oCostingSheetRow, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);


        this.checkReferenceObjectsCostingSheetRow(oResult, sMasterDataDate);

        return oResult;

    };













    this.insertCostingSheetRowTextRow = async function (oCostingSheetRowTextRow, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRow,
            aPartialKeyPlcTableColumns: [
                'COSTING_SHEET_ROW_ID',
                'COSTING_SHEET_ID'
            ],
            aTextColumns: ['COSTING_SHEET_ROW_DESCRIPTION']
        };
        return apiHelpers.insertTextRow(oCostingSheetRowTextRow, sMasterDataDate, oConfiguration, hQuery, this.helper);

    };












    this.insertCostingSheetRowDependenciesRow = async function (oCostingSheetDependencies, sMasterDataDate) {

        var oConfiguration = {
            sObjectName: sCostingSheetRowDependencies,
            aPartialKeyPlcTableColumns: [
                'SOURCE_ROW_ID',
                'TARGET_ROW_ID',
                'COSTING_SHEET_ID'
            ]
        };

        var aFoundCostingSheetRecords = apiHelpers.findValidEntriesInTable(Resources[sCostingSheet].dbobjects.plcTable, [oConfiguration.aPartialKeyPlcTableColumns[2]], [oCostingSheetDependencies.COSTING_SHEET_ID], sMasterDataDate, hQuery);
        if (aFoundCostingSheetRecords.length === 0) {
            const sLogMessage = `No costing sheet found in t_costing_sheet`;
            $.trace.error(sLogMessage);
            var oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }

        var oResult = apiHelpers.insertRow(oCostingSheetDependencies, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);

        return oResult;

    };




    function initResults() {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_TEXT_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_BASE_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_OVERHEAD_ROW_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.COSTING_SHEET_ROW_DEPENDENCIES_ENTITIES] = [];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = [];

        return oResult;

    }







    this.getItemCategories = async function () {
        try {
            const sStmt = ` SELECT ITEM_CATEGORY_ID, CHILD_ITEM_CATEGORY_ID FROM "${ Tables.item_category }"`;
            const oResult = helpers.transposeResultArray(dbConnection.executeQuery(sStmt));
            return _.zipObject(oResult.CHILD_ITEM_CATEGORY_ID, oResult.ITEM_CATEGORY_ID);
        } catch (e) {
            const sClientMsg = 'Error while getting item categories.';
            const sServerMsg = `${ sClientMsg }, Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };

}

CostingSheetRow.prototype = Object.create(CostingSheetRow.prototype);
CostingSheetRow.prototype.constructor = CostingSheetRow;
export default {_,helpers,BusinessObjectTypes,Resources,BusinessObjectsEntities,CostingSheetResources,aSource,Helper,Metadata,Misc,apiHelpers,UrlToSqlConverter,MessageLibrary,ValidationInfoCode,MessageOperation,PlcException,Code,MessageDetails,AdministrationObjType,FormulaInterpreterError,GenericSyntaxValidator,sSessionId,sUserId,Procedures,Tables,Sequences,CostingSheetRow};
