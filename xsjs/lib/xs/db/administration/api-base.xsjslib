var _ = $.require('lodash');
var helpers = $.require('../../util/helpers');
var Resources = $.require('../../util/masterdataResources').MasterdataResource;
var Limits = $.require('../../util/masterdataResources').Limits;
var Helper = $.require('../persistency-helper').Helper;
var Metadata = $.require('../persistency-metadata').Metadata;
var apiHelpers = $.import('xs.db.administration', 'api-helper');
var UrlToSqlConverter = $.require('../../util/urlToSqlConverter').UrlToSqlConverter;

const MessageLibrary = $.require('../../util/message');
const MessageOperation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;


function MasterdataBase(dbConnection, hQuery, hQueryRepl, oConfiguration) {

    this.helper = new Helper($, hQuery, dbConnection);
    this.metadata = new Metadata($, hQuery, null, $.getPlcUsername());
    this.aMetadataFields = this.metadata.getMetadataFields(oConfiguration.sObjectName, oConfiguration.sObjectName, null);
    this.converter = new UrlToSqlConverter();
    var that = this;

    /*************************************************************************************************************************
	 * Get
	 *************************************************************************************************************************/

    /**
	 * Get data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {object} oGetParameters - object with parameters (determined from URL)
	 * @param   {string} sLanguage      - language (taken from Session)
	 * @returns {object} oReturnObject  - object containing the main entities, referenced entities and texts
	 */
    MasterdataBase.prototype.get = async function (oGetParameters, sLanguage, sMasterDataDate) {

        var oReturnObject = {};
        var sTextFromAutocomplete = '';
        var iNoRecords = Limits.Top;
        var sSQLstring = '';

        if (!helpers.isNullOrUndefined(oGetParameters.searchAutocomplete)) {
            sTextFromAutocomplete = oGetParameters.searchAutocomplete;
        }

        if (!helpers.isNullOrUndefined(oGetParameters.filter)) {
            sSQLstring = this.converter.convertToSqlFormat(oGetParameters.filter, this.aMetadataFields);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.top)) {
            iNoRecords = parseInt(oGetParameters.top);
        }

        if (!helpers.isNullOrUndefined(oGetParameters.masterdataTimestamp)) {
            sMasterDataDate = oGetParameters.masterdataTimestamp;
        }

        oReturnObject = this.getDataUsingSqlProcedure(oGetParameters, sLanguage, sMasterDataDate, sTextFromAutocomplete, iNoRecords, sSQLstring);

        return oReturnObject;

    };

    /**
	 * Get data using sql procedure
	 *
	 * @param   {object} oGetParameters        - object with parameters - used in case that other parameters are send beside the standard one
	 * @param   {string} sLanguage             - language 
	 * @param   {string} sMasterDataDate       - current data
	 * @param   {string} sTextFromAutocomplete - search text used for autocomplete
	 * @param   {string} iNoRecords            - number of records that should be selected
	 * @param   {string} sSQLstring            - sql string used for filtering
	 * @returns {object} oReturnObject         - object containing the main entities, referenced entities and texts
	 */
    MasterdataBase.prototype.getDataUsingSqlProcedure = function (oGetParameters, sLanguage, sMasterDataDate, sTextFromAutocomplete, iNoRecords, sSQLstring) {
        return {};
    };

    /*************************************************************************************************************************
	 * Delete
	 *************************************************************************************************************************/

    /**
	 * Delete data (this method is called from persistency-administration.xsjslib)
	 *
	 * @param   {objects} oBatchItems - object containing an array of masterdata objects
	 * @param   {string} sMasterDataDate       - current data
	 * @returns {object}  oResult     - deleted entries / errors
	 */
    MasterdataBase.prototype.remove = async function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            hasErrors: false,
            errors: []
        };

        var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
        oResult.entities[oConfiguration.MainEntitiesSection] = [];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                that.checkMainRowRemove(oRecord, sMasterDataDate);
                var oResultDelete = that.removeMainRow(oRecord, sMasterDataDate);
                oResult.entities[oConfiguration.MainEntitiesSection].push(oResultDelete);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, oConfiguration.MainEntitiesSection, e, MessageOperation.DELETE, oResult);
            }
        });

        if (!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable) && Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== '') {
            var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
            oResult.entities[oConfiguration.TextEntitiesSection] = [];
            _.each(aBatchTextItems, async function (oRecord) {
                try {
                    that.checkTextRowRemove(oRecord, sMasterDataDate);
                    var oTextResultDelete = await that.removeTextRow(oRecord, sMasterDataDate);
                    oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultDelete);
                } catch (e) {
                    oResult.hasErrors = true;
                    await apiHelpers.createResponse(oRecord, oConfiguration.TextEntitiesSection, e, MessageOperation.DELETE, oResult);
                }
            });
        }

        this.checkAfterRemove(oResult);

        return oResult;

    };

    /**
	 * Checks main row before delete
	 *
	 * @param   {object} oObject          - deleted entry
	 * @param   {string} sMasterDataDate  - master data timestamp
	 * @returns {object} oResult          - deleted entry
	 */
    MasterdataBase.prototype.checkMainRowRemove = async function (oObject, sMasterDataDate) {
        await apiHelpers.checkColumns(oObject, this.aMetadataFields);
    };








    MasterdataBase.prototype.checkTextRowRemove = async function (oObjectText, sMasterDataDate) {
        await apiHelpers.checkColumns(oObjectText, this.aMetadataFields);
    };








    MasterdataBase.prototype.removeMainRow = async function (oObject, sMasterDataDate) {
        return await apiHelpers.removeRow(oObject, sMasterDataDate, oConfiguration, hQuery);
    };








    MasterdataBase.prototype.removeTextRow = async function (oObjectText, sMasterDataDate) {
        return await apiHelpers.removeTextRow(oObjectText, sMasterDataDate, oConfiguration, hQuery);
    };




    MasterdataBase.prototype.checkAfterRemove = function (oObject) {
	    };












    MasterdataBase.prototype.insert = async function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            hasErrors: false,
            errors: []
        };

        var aChangedObjectsKeys = [];

        var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
        oResult.entities[oConfiguration.MainEntitiesSection] = [];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                that.checkMainRowInsert(oRecord, sMasterDataDate);
                var oMainResultInsert = that.insertMainRow(oRecord, sMasterDataDate);
                oResult.entities[oConfiguration.MainEntitiesSection].push(oMainResultInsert);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, oConfiguration.MainEntitiesSection, e, MessageOperation.CREATE, oResult);
            }
        });

        if (!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable) && Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== '') {
            var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
            oResult.entities[oConfiguration.TextEntitiesSection] = [];
            _.each(aBatchTextItems, async function (oRecord) {
                try {
                    that.checkTextRowInsert(oRecord, sMasterDataDate);
                    var oTextResultInsert = await that.insertTextRow(oRecord, sMasterDataDate);
                    if (oConfiguration.bIsVersioned)
                        aChangedObjectsKeys.push(_.pick(oTextResultInsert, oConfiguration.aPartialKeyPlcTableColumns));
                    oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultInsert);
                } catch (e) {
                    oResult.hasErrors = true;
                    await apiHelpers.createResponse(oRecord, oConfiguration.TextEntitiesSection, e, MessageOperation.CREATE, oResult);
                }
            });

            if (oConfiguration.bIsVersioned) {
                if (oResult.hasErrors == false && aChangedObjectsKeys.length > 0) {

                    var oCopiedObjects = await apiHelpers.copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, this.helper);
                    oResult.entities[oConfiguration.MainEntitiesSection] = oResult.entities[oConfiguration.MainEntitiesSection].concat(oCopiedObjects.main);
                    oResult.entities[oConfiguration.TextEntitiesSection] = oResult.entities[oConfiguration.TextEntitiesSection].concat(oCopiedObjects.texts);
                }
            }
        }

        this.checkAfterInsert(oResult);

        return oResult;

    };








    MasterdataBase.prototype.checkMainRowInsert = async function (oObject, sMasterDataDate) {
        await apiHelpers.checkColumns(oObject, this.aMetadataFields);
    };








    MasterdataBase.prototype.checkTextRowInsert = async function (oObjectText, sMasterDataDate) {
        await apiHelpers.checkColumns(oObjectText, this.aMetadataFields);
    };




    MasterdataBase.prototype.checkAfterInsert = function (oObject) {
	    };








    MasterdataBase.prototype.insertMainRow = async function (oObject, sMasterDataDate) {

        var oResult = await apiHelpers.insertRow(oObject, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);



        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };







    MasterdataBase.prototype.checkCreateReferenceObjects = function (oObject, sMasterDataDate) {

	    };









    MasterdataBase.prototype.copyDataFromErp = async function (aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate) {


        var oResult = await apiHelpers.copyDataFromErp(aKeyFieldsPlcTable, aKeyFieldsValuesPlcTable, sMasterDataDate, oConfiguration, hQuery, hQueryRepl, this.helper);


        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };








    MasterdataBase.prototype.insertTextRow = async function (oObjectText, sMasterDataDate) {
        return await apiHelpers.insertTextRow(oObjectText, sMasterDataDate, oConfiguration, hQuery, this.helper);
    };












    MasterdataBase.prototype.update = async function (oBatchItems, sMasterDataDate) {

        var oResult = {
            entities: {},
            hasErrors: false,
            errors: []
        };

        var aChangedObjectsKeys = [];

        var aBatchMainItems = oBatchItems[oConfiguration.MainEntitiesSection];
        oResult.entities[oConfiguration.MainEntitiesSection] = [];
        _.each(aBatchMainItems, async function (oRecord) {
            try {
                that.checkMainRowUpdate(oRecord, sMasterDataDate);
                var oMainResultUpdate = that.updateMainRow(oRecord, sMasterDataDate);
                if (oConfiguration.bIsVersioned)
                    aChangedObjectsKeys.push(_.pick(oMainResultUpdate, oConfiguration.aPartialKeyPlcTableColumns));
                oResult.entities[oConfiguration.MainEntitiesSection].push(oMainResultUpdate);
            } catch (e) {
                oResult.hasErrors = true;
                await apiHelpers.createResponse(oRecord, oConfiguration.MainEntitiesSection, e, MessageOperation.UPDATE, oResult);
            }
        });

        if (!helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.plcTextTable) && Resources[oConfiguration.sObjectName].dbobjects.plcTextTable !== '') {
            var aBatchTextItems = oBatchItems[oConfiguration.TextEntitiesSection];
            oResult.entities[oConfiguration.TextEntitiesSection] = [];
            _.each(aBatchTextItems, async function (oRecord) {
                try {
                    that.checkTextRowUpdate(oRecord, sMasterDataDate);
                    var oTextResultUpdate = await that.updateTextRow(oRecord, sMasterDataDate);
                    if (oConfiguration.bIsVersioned)
                        aChangedObjectsKeys.push(_.pick(oTextResultUpdate, oConfiguration.aPartialKeyPlcTableColumns));
                    oResult.entities[oConfiguration.TextEntitiesSection].push(oTextResultUpdate);
                } catch (e) {
                    oResult.hasErrors = true;
                    await apiHelpers.createResponse(oRecord, oConfiguration.TextEntitiesSection, e, MessageOperation.UPDATE, oResult);
                }
            });

            if (oConfiguration.bIsVersioned) {
                if (oResult.hasErrors == false && aChangedObjectsKeys.length > 0) {

                    var oCopiedObjects = await apiHelpers.copyUnchangedRows(aChangedObjectsKeys, oConfiguration, sMasterDataDate, hQuery, this.helper);
                    oResult.entities[oConfiguration.MainEntitiesSection] = oResult.entities[oConfiguration.MainEntitiesSection].concat(oCopiedObjects.main);
                    oResult.entities[oConfiguration.TextEntitiesSection] = oResult.entities[oConfiguration.TextEntitiesSection].concat(oCopiedObjects.texts);
                }
            }
        }

        this.checkAfterUpdate(oResult);

        return oResult;

    };








    MasterdataBase.prototype.checkMainRowUpdate = async function (oObject, sMasterDataDate) {
        await apiHelpers.checkColumns(oObject, this.aMetadataFields);
    };








    MasterdataBase.prototype.checkTextRowUpdate = async function (oObjectText, sMasterDataDate) {
        await apiHelpers.checkColumns(oObjectText, this.aMetadataFields);
    };




    MasterdataBase.prototype.checkAfterUpdate = function (oObject) {
	    };








    MasterdataBase.prototype.updateMainRow = async function (oObject, sMasterDataDate) {

        var oResult = await apiHelpers.updateRow(oObject, sMasterDataDate, oConfiguration, hQuery, this.helper);



        this.checkCreateReferenceObjects(oResult, sMasterDataDate);

        return oResult;

    };








    MasterdataBase.prototype.updateTextRow = async function (oObjectText, sMasterDataDate) {
        return await apiHelpers.updateTextRow(oObjectText, sMasterDataDate, oConfiguration, hQuery, this.helper);
    };












    MasterdataBase.prototype.checkCreateReferenceObject = async function (oObject, sMasterDataDate) {

        if (!_.isObject(oObject)) {
            const sLogMessage = `oObject must be a valid object: ${ JSON.stringify(oObject) }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        var aPartialKeyPlcTableColumns = oConfiguration.aPartialKeyPlcTableColumns;

        if (!await apiHelpers.areAllFieldsEmpty(aPartialKeyPlcTableColumns, oObject)) {
            var aFieldsValuesMainPlcTable = await apiHelpers.getColumnKeyValues(aPartialKeyPlcTableColumns, oObject);
            var aFoundPlcRecords = await apiHelpers.findValidEntriesInTable(Resources[oConfiguration.sObjectName].dbobjects.plcTable, aPartialKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate, hQuery);
            if (aFoundPlcRecords.length === 0) {

                if (helpers.isNullOrUndefined(Resources[oConfiguration.sObjectName].dbobjects.erpTable) || Resources[oConfiguration.sObjectName].dbobjects.erpTable === '') {
                    const sLogMessage = `ERP table was not specified for business object ${ oConfiguration.sObjectName }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                } else {
                    await this.copyDataFromErp(aPartialKeyPlcTableColumns, aFieldsValuesMainPlcTable, sMasterDataDate);
                }
            }
        }
    };

}

MasterdataBase.prototype = Object.create(MasterdataBase.prototype);
MasterdataBase.prototype.constructor = MasterdataBase;
export default {_,helpers,Resources,Limits,Helper,Metadata,apiHelpers,UrlToSqlConverter,MessageLibrary,MessageOperation,PlcException,Code,MasterdataBase};
