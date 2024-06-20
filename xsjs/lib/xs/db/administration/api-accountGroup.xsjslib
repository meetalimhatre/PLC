const _ = $.require('lodash');
const helpers = $.require('../../util/helpers');
const BusinessObjectTypes = $.require('../../util/constants').BusinessObjectTypes;
const Resources = $.require('../../util/masterdataResources').MasterdataResource;
const BusinessObjectsEntities = $.require('../../util/masterdataResources').BusinessObjectsEntities;
const Limits = $.require('../../util/masterdataResources').Limits;
const Helper = $.require('../../db/persistency-helper').Helper;
const Metadata = $.require('../persistency-metadata').Metadata;
const Misc = $.require('../persistency-misc').Misc;
const apiHelpers = $.import('xs.db.administration', 'api-helper');
const UrlToSqlConverter = $.require('../../util/urlToSqlConverter').UrlToSqlConverter;

const MessageLibrary = $.require('../../util/message');
const Operation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const ValidationInfoCode = MessageLibrary.ValidationInfoCode;
const AdministrationObjType = MessageLibrary.AdministrationObjType;

var sUserId = $.getPlcUsername();

var Procedures = Object.freeze({ account_group_read: 'sap.plc.db.administration.procedures::p_account_group_read' });

function AccountGroup(dbConnection, hQuery, hQueryRepl) {

    this.helper = new Helper($, hQuery, dbConnection);
    this.metadata = new Metadata($, hQuery, null, sUserId);
    this.misc = new Misc($, hQuery, sUserId);
    this.converter = new UrlToSqlConverter();
    var aMetadataGroupFields = null;
    var that = this;
    var sBusinessObjectNameGroups = BusinessObjectTypes.AccountGroup; // AccountGroup
    var sBusinessObjectNameRanges = BusinessObjectTypes.AccountAccountGroup; //AccountRange;
    var sBusinessObjectName = BusinessObjectTypes.Account; //Account
    var oConfigurationAccounts = {
        sObjectName: sBusinessObjectName,
        aPartialKeyPlcTableColumns: [
            'ACCOUNT_ID',
            'CONTROLLING_AREA_ID'
        ]
    };
    var oConfigurationRanges = {
        sObjectName: sBusinessObjectNameRanges,
        aPartialKeyPlcTableColumns: [
            'FROM_ACCOUNT_ID',
            'ACCOUNT_GROUP_ID'
        ]
    };
    var oConfigurationGroups = {
        sObjectName: sBusinessObjectNameGroups,
        aPartialKeyPlcTableColumns: ['ACCOUNT_GROUP_ID'],
        aTextColumns: ['ACCOUNT_GROUP_DESCRIPTION'],
        aFieldsNotChangeble: ['CONTROLLING_AREA_ID'],
        UsedInBusinessObjects: [
            {
                'BusinessObjectName': BusinessObjectTypes.ComponentSplit,
                'TableName': Resources[BusinessObjectTypes.ComponentSplitAccountGroup].dbobjects.plcTable,
                'FieldsName': [['ACCOUNT_GROUP_ID']]
            },
            {
                'BusinessObjectName': BusinessObjectTypes.CostingSheet,
                'TableName': Resources[BusinessObjectTypes.CostingSheetRow].dbobjects.plcTable,
                'FieldsName': [['ACCOUNT_GROUP_AS_BASE_ID']]
            },
            {
                'BusinessObjectName': 'Project_ActivityPriceSurcharges',
                'TableName': 'sap.plc.db::basis.t_project_activity_price_surcharges',
                'FieldsName': [['ACCOUNT_GROUP_ID']],
                'IsVersioned': false
            },
            {
                'BusinessObjectName': 'Project_MaterialPriceSurcharges',
                'TableName': 'sap.plc.db::basis.t_project_material_price_surcharges',
                'FieldsName': [['ACCOUNT_GROUP_ID']],
                'IsVersioned': false
            }
        ]
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
        var noRecords = Limits.Top;
        var sSQLstring = '';
        var sTextFromAutocomplete = '';
        var noSkipRecords = 0;

        if (aMetadataGroupFields === null) {
            aMetadataGroupFields = this.metadata.getMetadataFields(sBusinessObjectNameGroups, sBusinessObjectNameGroups, null);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            sTextFromAutocomplete = oGetParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, aMetadataGroupFields);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.top)) {
            noRecords = parseInt(oGetParameters.top);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.skip)) {
            noSkipRecords = parseInt(oGetParameters.skip);
        }

        try {
            var procedure = dbConnection.loadProcedure(Procedures.account_group_read);
            var result = await procedure(sLanguage, sMasterDataDate, sTextFromAutocomplete, sSQLstring, noRecords, noSkipRecords);

            oReturnObject[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = Array.slice(result.OT_ACCOUNT_GROUPS);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = Array.slice(result.OT_ACCOUNT_GROUPS_TEXT);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES] = Array.slice(result.OT_ACCOUNT_RANGE);
            oReturnObject[BusinessObjectsEntities.ACCOUNT_ENTITIES] = Array.slice(result.OT_ACCOUNTS);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        } catch (e) {
            const sLogMessage = `Error during reading data when procedure ${ Procedures.account_group_read } is called.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, undefined, undefined, e);
        }

        return oReturnObject;

    };

    /**
	 * Delete data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of account groups
	 * @returns {object}  oResult     - deleted entries / errors
	 */
    this.remove = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        if (aMetadataGroupFields === null) {
            aMetadataGroupFields = this.metadata.getMetadataFields(sBusinessObjectNameGroups, sBusinessObjectNameGroups, null);
        }

        var aBatchAccGroupsItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = [];

        _.each(aBatchAccGroupsItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataGroupFields);
                var oResultDelete = that.removeAccountGroupsRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].push(oResultDelete);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES, e, Operation.DELETE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                var oTextResultDelete = that.removeAccountGroupTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES].push(oTextResultDelete);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES, e, Operation.DELETE, oResult);
            }
        });

        return oResult;

    };

    this.removeAllAccountRangesforAccountGroup = async function (oRecord, sMasterDataDate) {
        var sTableName = Resources[sBusinessObjectNameRanges].dbobjects.plcTable;

        var aValues = [];
        var aStmtBuilder = [];

        aStmtBuilder.push('update "' + sTableName + '" set _VALID_TO = ? WHERE ACCOUNT_GROUP_ID = ? AND _VALID_TO IS NULL');
        aValues.push(sMasterDataDate);
        aValues.push(oRecord.ACCOUNT_GROUP_ID);
        await hQuery.statement(aStmtBuilder.join('')).execute(aValues);
    };

    /**
      * Delete row
      *
      * @param {object} oAccountGroups - deleted entry
      *        E.g: {
						"ACCOUNT_GROUP_ID": 777,
                        "CONTROLLING_AREA_ID": "1000",
                        "_VALID_FROM": "2015-06-02T16:01:33.637Z",
                    }
      * @param   {string} sMasterDataDate  - master data timestamp
      * @returns {object} oResult          - deleted entry
      */
    this.removeAccountGroupsRow = async function (oAccountGroups, sMasterDataDate) {

        var oResult = await apiHelpers.removeRow(oAccountGroups, sMasterDataDate, oConfigurationGroups, hQuery);

        //delete entries from table t_account_account_group (Account Ranges)
        var aRangeRecords = await apiHelpers.findValidEntriesInTable(Resources[sBusinessObjectNameRanges].dbobjects.plcTable, [oConfigurationGroups.aPartialKeyPlcTableColumns[0]], [oAccountGroups.ACCOUNT_GROUP_ID], sMasterDataDate, hQuery);
        if (aRangeRecords.length !== 0) {
            var iDeletedRecords = await apiHelpers.updateEntriesWithValidToInTable(Resources[sBusinessObjectNameRanges].dbobjects.plcTable, [oConfigurationGroups.aPartialKeyPlcTableColumns[0]], [oAccountGroups.ACCOUNT_GROUP_ID], sMasterDataDate, hQuery);
            if (iDeletedRecords !== aRangeRecords.length) {
                const sLogMessage = `Not all account ranges were deleted.`;
                $.trace.error(sLogMessage);
                var oMessageDetails = new MessageDetails();
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
            }
        }

        return oResult;

    };

    /**
	 * Remove text row
	 *
	 * @param {object} oChartOfAccountsText - deleted entry
	 *        E.g: {
                      "ACCOUNT_GROUP_ID": "INT",
                      "_VALID_FROM": "2015-03-25T11:13:58.315Z",
                      "LANGUAGE":"EN"
                   }
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    this.removeAccountGroupTextRow = async function (oAccountGroupText, sMasterDataDate) {

        return await apiHelpers.removeTextRow(oAccountGroupText, sMasterDataDate, oConfigurationGroups, hQuery);

    };

    /**
	 * Insert data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of account groups + an array of account group texts
	 * @returns {object}  oResult     - inserted entries / errors
	 */
    this.insert = function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        if (aMetadataGroupFields === null) {
            aMetadataGroupFields = this.metadata.getMetadataFields(sBusinessObjectNameGroups, sBusinessObjectNameGroups, null);
        }

        var aBatchAccountGroupItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = [];
        _.each(aBatchAccountGroupItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataGroupFields);
                var oAccGrResultInsert = that.insertAccountGroupRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].push(oAccGrResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES, e, Operation.CREATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataGroupFields);
                var oTextResultInsert = that.insertAccountGroupTextRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES].push(oTextResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES, e, Operation.CREATE, oResult);
            }
        });

        var aBatchAccRangesItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES] = [];

        _.each(aBatchAccRangesItems, async function (oRecord) {
            try {
                var oAccRangeResultInsert = that.insertAccountRangeRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES].push(oAccRangeResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES, e, Operation.CREATE, oResult);
            }
        });

        return oResult;

    };

    /**
     * Insert row
     *
     * @param {object} oAccountGroup - inserted entry
     *        E.g: {
                    "ACCOUNT_GROUP_ID": 777,
		   			"CONTROLLING_AREA_ID": "1000"
                   }
     * @param   {string} sMasterDataDate  - master data timestamp
     * @returns {object} oResult          - inserted entry
     */
    this.insertAccountGroupRow = async function (oAccountGroup, sMasterDataDate) {

        var oResult = await apiHelpers.insertRow(oAccountGroup, sMasterDataDate, oConfigurationGroups, hQuery, hQueryRepl, this.helper);

        //check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
        //if exists, create in in PLC
        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };

    this.insertAccountGroupTextRow = async function (oAccountGroupText, sMasterDataDate) {

        return await apiHelpers.insertTextRow(oAccountGroupText, sMasterDataDate, oConfigurationGroups, hQuery, this.helper);

    };

    this.insertAccountRangeRow = async function (oAccountRange, sMasterDataDate) {

        var exceptionInfo = 'Inconsistent or missing data. See log for details';
        var aFieldsValuesAccountGroupTable = await apiHelpers.getColumnKeyValues(oConfigurationRanges.aPartialKeyPlcTableColumns, oAccountRange);
        var aFoundAccountGroupRecords = await apiHelpers.findValidEntriesInTable(Resources[sBusinessObjectNameGroups].dbobjects.plcTable, [oConfigurationRanges.aPartialKeyPlcTableColumns[1]], [aFieldsValuesAccountGroupTable[1]], sMasterDataDate, hQuery);
        if (aFoundAccountGroupRecords.length === 0) {
            const sLogMessage = `There is no entry in account group table. You cannot create a range.`;
            $.trace.error(sLogMessage);
            var oMessageDetails = new MessageDetails();
            oMessageDetails.administrationObjType = AdministrationObjType.MAIN_OBJ;
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }

        var oResult = await apiHelpers.insertRow(oAccountRange, sMasterDataDate, oConfigurationRanges, hQuery, hQueryRepl, this.helper);

        return oResult;

    };

    /**
	 * Check if the referenced objects exists; if they do not exist, then create them
	 *
	 * @param   {object} oAccountGroup - entry that is checked
	 * @param   {string} sMasterDataDate  - master data timestamp
	 */
    this.checkCreateReferenceObjects = async function (oAccountGroup, sMasterDataDate) {

        //take each referenced object
        var aFieldsMainPlcTable = ['CONTROLLING_AREA_ID'];//name in t_account_group
        var aKeyFieldsRefObjectPlcTable = ['CONTROLLING_AREA_ID'];//name in t_controlling_area  
        var aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aFieldsMainPlcTable, oAccountGroup);
        var oControllingArea = _.zipObject(aKeyFieldsRefObjectPlcTable, aFieldsValuesMainPlcTable);
        apiHelpers.checkObjectExists(oControllingArea, sMasterDataDate, BusinessObjectTypes.ControllingArea, hQuery);

    };

    /**
	 * Update data (this method is called from persistency-configuration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of account groups + an array of account group texts
	 * @returns {object}  oResult     - updated entries / errors
	 */
    this.update = async function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            conflictingEntities: {},
            hasErrors: false,
            errors: []
        };

        var aChangedObjectsKeys = [];

        if (aMetadataGroupFields === null) {
            aMetadataGroupFields = this.metadata.getMetadataFields(sBusinessObjectNameGroups, sBusinessObjectNameGroups, null);
        }

        //Account_Ranges is part of the Account_Group business object.
        //All the changes to Account Ranges are send on an Update Request.
        //In the case of an update request with account ranges, all the ranges of the Account_group are deactivated and 
        //then the active ones are created again.
        var aBatchAccountRangeItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES];
        var aBatchAccountGroupItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = [];
        _.each(aBatchAccountGroupItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataGroupFields);
                if ('COST_PORTION' in oRecord) {
                    var oAccGrResultInsert = that.updateAccountGroupRow(oRecord, sMasterDataDate);
                    aChangedObjectsKeys.push(_.pick(oAccGrResultInsert, oConfigurationGroups.aPartialKeyPlcTableColumns));
                    oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].push(oAccGrResultInsert);
                }
                if (!helpers.isNullOrUndefined(aBatchAccountRangeItems)) {
                    that.removeAllAccountRangesforAccountGroup(oRecord, sMasterDataDate);
                }
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES, e, Operation.UPDATE, oResult);
            }
        });

        var aBatchTextItems = oBatchItems[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES];
        oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = [];
        _.each(aBatchTextItems, async function (oRecord) {
            try {
                await apiHelpers.checkColumns(oRecord, aMetadataGroupFields);
                var oTextResultInsert = that.updateAccountGroupTextRow(oRecord, sMasterDataDate);
                aChangedObjectsKeys.push(_.pick(oTextResultInsert, oConfigurationGroups.aPartialKeyPlcTableColumns));
                oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES].push(oTextResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES, e, Operation.UPDATE, oResult);
            }
        });

        oResult.entities[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES] = [];
        _.each(aBatchAccountRangeItems, async function (oRecord) {
            try {
                var oAccountRangeResultInsert = that.insertAccountRangeRow(oRecord, sMasterDataDate);
                oResult.entities[BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES].push(oAccountRangeResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                apiHelpers.createResponse(oRecord, BusinessObjectsEntities.ACCOUNT_RANGES_ENTITIES, e, Operation.UPDATE, oResult);
            }
        });

        if (oResult.hasErrors == false && aChangedObjectsKeys.length > 0) {
            //we need to copy the entries if we create a text for an entity that already exists
            var oCopiedObjects = await apiHelpers.copyUnchangedRows(aChangedObjectsKeys, oConfigurationGroups, sMasterDataDate, hQuery, this.helper);
            oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES] = oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_ENTITIES].concat(oCopiedObjects.main);
            oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES] = oResult.entities[BusinessObjectsEntities.ACCOUNT_GROUP_TEXT_ENTITIES].concat(oCopiedObjects.texts);
        }

        return oResult;

    };

    /**
     * Update row
     *
     * @param {object} oAccountGroup - updated entry
     *        E.g: {
					"ACCOUNT_GROUP_ID": 777,
					"CONTROLLING_AREA_ID": "1000",
					"_VALID_FROM": "2015-06-02T15:29:59.823Z"
                   }
     * @param   {string} sMasterDataDate  - master data timestamp
     * @returns {object} oResult          - updated entry
     */
    this.updateAccountGroupRow = async function (oAccountGroup, sMasterDataDate) {

        var oResult = await apiHelpers.updateRow(oAccountGroup, sMasterDataDate, oConfigurationGroups, hQuery, this.helper);

        //check if the reference objects data exists in PLC; if it does not exist in PLC, check if the reference objects data exists in ERP; 
        //if exists, create in in PLC
        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };

    this.updateAccountGroupTextRow = async function (oAccountGroupText, sMasterDataDate) {

        return await apiHelpers.updateTextRow(oAccountGroupText, sMasterDataDate, oConfigurationGroups, hQuery, this.helper);

    };
}

AccountGroup.prototype = Object.create(AccountGroup.prototype);
AccountGroup.prototype.constructor = AccountGroup;
export default {_,helpers,BusinessObjectTypes,Resources,BusinessObjectsEntities,Limits,Helper,Metadata,Misc,apiHelpers,UrlToSqlConverter,MessageLibrary,Operation,PlcException,Code,MessageDetails,ValidationInfoCode,AdministrationObjType,sUserId,Procedures,AccountGroup};
