const _ = require('lodash');
const helpers = require('../util/helpers');
const Helper = require('./persistency-helper').Helper;
const Metadata = require('./persistency-metadata').Metadata;

const BusinessObjectsEntities = require('../util/masterdataResources').BusinessObjectsEntities;
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;
const MapStandardFieldsWithFormulas = require('../util/constants').mapStandardFieldsWithFormulas;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

module.exports.Tables = Object.freeze({
    item: 'sap.plc.db::basis.t_item',
    item_ext: 'sap.plc.db::basis.t_item_ext',
    item_temporary: 'sap.plc.db::basis.t_item_temporary',
    item_temporary_ext: 'sap.plc.db::basis.t_item_temporary_ext',
    gtt_item_temporary: 'sap.plc.db::basis.gtt_item_temporary',
    gtt_item_changed_active_state: 'sap.plc.db::temp.gtt_item_changed_active_state',
    gtt_item_temporary_with_masterdata_custom_fields: 'sap.plc.db::basis.gtt_item_temporary_with_masterdata_custom_fields',
    metadataItemAttributes: 'sap.plc.db::basis.t_metadata_item_attributes',
    metadata: 'sap.plc.db::basis.t_metadata',
    formula: 'sap.plc.db::basis.t_formula',
    gtt_reference_calculation_version_items: 'sap.plc.db::temp.gtt_reference_calculation_version_items',
    gtt_changed_items: 'sap.plc.db::temp.gtt_changed_items',
    price_source: 'sap.plc.db::basis.t_price_source',
    variant_item: 'sap.plc.db::basis.t_variant_item',
    material: 'sap.plc.db::basis.t_material',
    item_category: 'sap.plc.db::basis.t_item_category'
});

module.exports.Procedures = Object.freeze({
    create_item: 'sap.plc.db.calculationmanager.procedures::p_item_create',
    delete_item: 'sap.plc.db.calculationmanager.procedures::p_item_delete_item_with_children',
    delete_items_marked_for_deletion: 'sap.plc.db.calculationmanager.procedures::p_item_delete_items_marked_for_deletion',
    get_items: 'sap.plc.db.calculationmanager.procedures::p_item_get_items',
    update_referenced_calc_version: 'sap.plc.db.calculationmanager.procedures::p_item_update_set_referenced_version',
    value_determination: 'sap.plc.db.calculationmanager.procedures::p_item_automatic_value_determination',
    price_determination: 'sap.plc.db.calculationmanager.procedures::p_item_price_determination',
    set_active_states: 'sap.plc.db.calculationmanager.procedures::p_item_set_active_states',
    get_prices_for_item: 'sap.plc.db.calculationmanager.procedures::p_item_get_prices',
    update_is_manual_for_standard_fields_with_formula: 'sap.plc.db.calculationmanager.procedures::p_item_update_is_manual_for_standard_fields_with_formula',
    set_reporting_currency_item_custom_fields: 'sap.plc.db.calculationmanager.procedures::p_set_reporting_currency_item_custom_fields'
});

/**
 * Creates a new Calculation object.
 */

async function Item($, dbConnection, hQuery, sUserId) {
    const Tables = module.exports.Tables; // for easy mock in testing
    const Procedures = module.exports.Procedures; // for easy mock in testing

    var oMessageDetails = new MessageDetails();
    var helper = await new Helper($, hQuery, dbConnection);
    var metadata = await new Metadata($, hQuery, dbConnection, sUserId);

    /**
	 * Gets an undeleted item for a specified session.
	 *
	 * @param {integer}
	 *            iItemId - The id of the item, which shall be retrieved
	 * @param {integer}
	 *            iCalculationVersionId - CalculationVersionId of the items
	 * @param {string}
	 *            sSessionId - The session with which the item is associated
	 * @throws {PlcException} -
	 *             If sSesssioId or sUserId are not correctly set
	 * @throws {PlcException} -
	 *             If the execution of the select statement return a result set with more than 1 entry. This indicates an corrupted query or
	 *             illegal database state.
	 * @throws {PlcException} -
	 *             If the execution of the select statement return no result set. This indicates that no item was found in database.
	 * @returns {object} oItem - An object containing database data (columns as keys, whereas each key is associated with the value of the
	 *          stored in the column) if the an object for the given session and id was found.
	 */
    this.getItem = async function (iItemId, iCalculationVersionId, sSessionId) {
        oMessageDetails.addItemObjs({ id: iItemId });
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

        if (!await _.isNumber(iItemId) || iItemId % 1 !== 0 || iItemId < 0) {
            const sLogMessage = 'iItemId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!await _.isNumber(iCalculationVersionId) || iCalculationVersionId < 0) {
            const sLogMessage = 'iCalculationVersionId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var aoItems = [];
        aoItems.push(_.zipObject(['ITEM_ID'], [iItemId]));
        var aItems = this.get(aoItems, sSessionId, iCalculationVersionId).ITEMS;

        if (aItems.length > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 item during getting item.';
            const sServerMsg = `${ sClientMsg } Item id: ${ iItemId }, calculation version id: ${ iCalculationVersionId }, session id: ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        if (aItems.length == 0) {
            const sClientMsg = 'Item not found in calculation version and session.';
            const sServerMsg = `${ sClientMsg } Item id: ${ iItemId }, calculation version id: ${ iCalculationVersionId }, session id: ${ sSessionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }

        return aItems[0];
    };

    /**
	 * Gets a set of items from t_item_temporary.
	 *
	 * @param {array}
	 *            aItemIds - array of item id which shall be retrieved from the database
	 * @param {integer}
	 *            iCalculationVersionId - CalculationVersionId of the items
	 * @param {string}
	 *            sSessionId - The session with which the item is associated
	 * @throws {PlcException} -
	 *             If aItemIds is not an array, contains anything else that positive integers or sSessionId is null
	 * @returns {array} Returns an array containing item objects for each item id found in the database. Hence, the returned array can be
	 *          empty or shorter as aItemIds if not all item ids can be found.
	 */
    this.getItems = async function (aItemIds, iCalculationVersionId, sSessionId, bCompressedResult) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
        _.each(aItemIds, function (iItemId) {
            oMessageDetails.addItemObjs({ id: iItemId });
        });

        if (!_.isArray(aItemIds) || aItemIds.length === 0) {
            const sLogMessage = 'aItemIds must be a non-empty array.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        var bContainsOnlyNumbers = _.every(aItemIds, async function (iItemId) {
            return await _.isNumber(iItemId) && iItemId % 1 === 0 && iItemId >= 0;
        });
        if (!bContainsOnlyNumbers) {
            const sLogMessage = 'aItemIds can only contain positive integers.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!await _.isNumber(iCalculationVersionId) || iCalculationVersionId < 0) {
            const sLogMessage = 'iCalculationVersionId must be a positive integer.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        var aoItems = [];
        aoItems = _.map(aItemIds, function (iItemId) {
            return _.zipObject(['ITEM_ID'], [iItemId]);
        });
        bCompressedResult = bCompressedResult || false;
        if (bCompressedResult == true) {
            return this.get(aoItems, sSessionId, iCalculationVersionId, bCompressedResult).ITEMS_COMPRESSED;
        } else {
            return this.get(aoItems, sSessionId, iCalculationVersionId, bCompressedResult).ITEMS;
        }


    };

    /**
	 * Get items from database
	 *
	 * @param {array}
	 *            aItems - array with item ids
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            iCvId - calculation version id
	 * @returns {object} oResultSet - items
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.get = async function (aItemIds, sSessionId, iCvId, bCompressedResult) {
        try {
            var fnGet = dbConnection.loadProcedure(Procedures.get_items);
            var oResult = fnGet(aItemIds, sSessionId, iCvId);
            if (bCompressedResult === true) {
                return {
                    ITEMS: [],
                    ITEMS_COMPRESSED: await helpers.transposeResultArray(oResult.OT_ITEMS)
                };
            } else {
                return {
                    ITEMS: Array.slice(oResult.OT_ITEMS),
                    ITEMS_COMPRESSED: {}
                };
            }
        } catch (e) {
            const sClientMsg = 'Error while getting items.';
            const sServerMsg = `${ sClientMsg } Item ids: ${ aItemIds.join(',') }, Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };

    /**
	 * Get an array of all item ids (array of integers) that are marked dirty for the specified calculation version. *
	 *
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            iCvId - calculation version id
	 * @returns {array} - array of integers, whereas each integer is an id of an item marked dirty
	 */
    this.getIdsOfDirtyItems = function (sSessionId, iCvId) {
        var aDirtyItems = helper.selectEntities({
            TABLE: Tables.item_temporary,
            COLUMNS: ['ITEM_ID'],
            WHERE_PROPERTIES: {
                'SESSION_ID': sSessionId,
                'CALCULATION_VERSION_ID': iCvId,
                'IS_DIRTY': 1,
                'IS_DELETED': 0
            }
        });

        var aIdsOfDirtyItems = [];
        _.each(aDirtyItems, function (oDirtyItem) {
            aIdsOfDirtyItems.push(oDirtyItem.ITEM_ID);
        });
        return aIdsOfDirtyItems;
    };

    /**
	 * Get only the fields relevant to be updated after a save or save as on client's side from t_item_temporary. These fields encompass
	 * the audit fields of the items as well as "PRICE_SOURCE_ID", "PRICE_SOURCE_TYPE_ID" (since after the save-as of a lifecycle version, the
 	 * price information can be reset for some items; it was decided that delivering for all items wouldn't have a major performance impact).
	 * 
	 * @param {array}
	 *            aItemIds - array of integers for which items the audit fields are requested; is an optional parameter and if it is not
	 *            set, all items of the specified versions are returned; if an empty array is given, the method returns an empty array
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            iCvId - calculation version id
	 * @returns {array} - array of all item objects, whereas all item objects only contain the audit fields
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.getSaveRelevantFields = async function (aItemIds, sSessionId, iCvId, iMaxLimit) {
        // check if the optional aItemIds parameter is set
        const bHasItemsParameter = aItemIds !== null && aItemIds !== undefined;

        if (bHasItemsParameter) {
            if (_.isArray(aItemIds) === false) {
                const sLogMessage = 'If aItemIds was defined in this function, it must be an array.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
            if (aItemIds.length > 0) {
                // Check that the aItemIds array only contains integers
                if (!aItemIds.every(id => Number.isInteger(id))) {
                    const sLogMessage = 'aItemIds parameter contains non-integer entries.';
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
            } else {
                // for an empty aItemIds parameter, just also return an empty array
                return [];
            }
        }

        const aAuditFields = [
            'ITEM_ID',
            'CALCULATION_VERSION_ID',
            'CREATED_ON',
            'CREATED_BY',
            'LAST_MODIFIED_ON',
            'LAST_MODIFIED_BY',
            'IS_DIRTY',
            'PRICE_SOURCE_ID',
            'PRICE_SOURCE_TYPE_ID'
        ];

        let sStmt = `select ${ aAuditFields.join(', ') }
			 from "${ Tables.item_temporary }"
			 where session_id = ? and calculation_version_id = ? and is_deleted = 0`;

        const MAX_LIMIT = iMaxLimit || 10000;

        if (bHasItemsParameter) {
            // Only if the optional parameter aItemIds is defined, add the list of item_ids to the query statement.
            // The item_ids cannot be specified via "?" in the SQL statement as there is a HANA limit for the
            // maximum number of parameters (more than 30.000) and this was reached with big calculation versions. 
            // Also for solving the problem of saving big calculations the array of item ids was sliced into smaller batches.
            // We already checked for valid item_ids, so that there is no possibility of SQL injection here.

            if (aItemIds.length > MAX_LIMIT) {
                let aAuditResult = [];
                let index = 0;
                for (let i = 0; i <= aItemIds.length / MAX_LIMIT; i++) {
                    let sStmtVar = sStmt + ` and item_id in (${ aItemIds.slice(index, index + MAX_LIMIT).join(',') })`;
                    aAuditResult = aAuditResult.concat(Array.from(await dbConnection.executeQuery(sStmtVar, sSessionId, iCvId)));
                    index += MAX_LIMIT;
                }
                return aAuditResult;
            } else {
                sStmt += ` and item_id in (${ aItemIds.join(',') })`;
                const oAuditResult = await dbConnection.executeQuery(sStmt, sSessionId, iCvId);
                return Array.from(oAuditResult);
            }
        } else {
            const oAuditResult = await dbConnection.executeQuery(sStmt, sSessionId, iCvId);
            return Array.from(oAuditResult);
        }

    };

    /**
	 * This function updates the predecessor relationship (represented by <code>PREDECESSOR_ID</code>) for a given item id in case it was
	 * added or moved. It searches for old items that refer the given prodecessor id of the moved or added item and sets this predecessor id
	 * to the id of the moved or added item.
	 *
	 * For example: given A <= B <= C (whereas <= indicates the predecessor relationship); if you move C so that you got A <= C <= B
	 *
	 * In this case the function sets the predecessor of B to C. Remember that the moved item C already has the correct predecessor A set.
	 *
	 */
    async function updateSuccessor(oItem, sSessionId) {
        var iCalcVersionId = await helpers.getValueOnKey(oItem, 'CALCULATION_VERSION_ID');
        var parentItemId = await helpers.getValueOnKey(oItem, 'PARENT_ITEM_ID');
        var predecessorItemId = await helpers.getValueOnKey(oItem, 'PREDECESSOR_ITEM_ID');
        var iItemId = await helpers.getValueOnKey(oItem, 'ITEM_ID');
        var iIsDirty = 1;

        var sUpdatePredecessorStatement = 'update "sap.plc.db::basis.t_item_temporary" set predecessor_item_id = ?, is_dirty = ? ' + 'where session_id = ? and calculation_version_id = ? and parent_item_id = ? ' + 'and item_id<>?';
        sUpdatePredecessorStatement += predecessorItemId === null ? ' and predecessor_item_id is null' : ' and predecessor_item_id =?';

        var oUpdatePredecessorStatement = hQuery.statement(sUpdatePredecessorStatement);

        if (predecessorItemId === null) {
            await oUpdatePredecessorStatement.execute(iItemId, iIsDirty, sSessionId, iCalcVersionId, parentItemId, iItemId);
        } else {
            await oUpdatePredecessorStatement.execute(iItemId, iIsDirty, sSessionId, iCalcVersionId, parentItemId, iItemId, predecessorItemId);
        }
    }

    /**
	 * Helper function to get all column names for custom fields, including *_MANUAL, *_UNIT, *_IS_MANUAL.
	 * 
	 * @returns {array} array of custom fields column names
	 */
    function determineAllCustomFields() {
        // determine all possible custom fields
        const aAllCustomFields = [];
        const aMetadataFields = metadata.getMetadataFields(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null);
        // We need to find all custom fields and ignore *_UNIT entries in t_metadata
        _.each(aMetadataFields, (oMetadataField, iIndex) => {
            if (oMetadataField.IS_CUSTOM === 1 && oMetadataField.UOM_CURRENCY_FLAG !== 1) {
                // each logical custom field has at least two database columns: *_MANUAL and *_UNIT
                aAllCustomFields.push(oMetadataField.COLUMN_ID + '_MANUAL');
                aAllCustomFields.push(oMetadataField.COLUMN_ID + '_UNIT');

                // Custom fields on item, which are named CUST_*, additionally have
                // *_IS_MANUAL column (*_CALCULATED is not relevant).
                // Custom fields on masterdata don't have it. 
                if (oMetadataField.COLUMN_ID.startsWith('CUST_')) {
                    aAllCustomFields.push(oMetadataField.COLUMN_ID + '_IS_MANUAL');
                }
            }
        });
        return aAllCustomFields;
    }

    /**
	 * Updates item. Each property of the given JavaScript object is matched to column of the table. The property value is written to the
	 * table for the corresponding column. A column is only affected if the JS object contains a property with the column name. If a value
	 * should be deleted from a column, the corresponding property in the JS object must have <code>null</code> as value.
	 *
	 * The properties ITEM_ID and CALCULATION_VERSION_ID, together with the function parameter for the session are used to identify the
	 * entity, which is affected by the update statement. These properties cannot be changed by this function and the given JS object must
	 * contain them.
	 *
	 * @param {object}
	 *            oItem - The JS object containing the new values for an item entity. Property names have to match the columns of
	 *            t_item_temporary and property values are written to the table. *
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 *
	 * @param {boolean}
	 *            bUpdateOnlyStandardFields - Update only standard fields (e.g. when prices are reset for parents when an item is deleted)
	 *
	 * @returns {integer} - 1 if an entity was updated or 0 if the entity was not affected by the update.
	 */
    this.update = async function (oItem, sSessionId, bUpdateOnlyStandardFields, iOldCategoryId, iNewCategoryId) {

        if (helpers.isNullOrUndefined(bUpdateOnlyStandardFields))
            bUpdateOnlyStandardFields = false;

        if (helpers.isNullOrUndefined(iOldCategoryId))
            iOldCategoryId = 0;

        if (helpers.isNullOrUndefined(iNewCategoryId))
            iNewCategoryId = 0;

        if (!helpers.isPlainObject(oItem)) {
            const sLogMessage = 'oItem must be an object';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        if (!_.has(oItem, 'ITEM_ID') || !_.has(oItem, 'CALCULATION_VERSION_ID')) {
            const sLogMessage = 'Missing mandatory properties ITEM_ID and CALCULATION_VERSION_ID for given item object. ' + 'These properties are primary keys of t_item_temporary and MUST be contained in the given object.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        // to make sure that "ITEM_ID", "CALCULATION_VERSION_ID", "SESSION_ID"
        // are not updated, the properties are removed
        // from the object before the SQL statement is generated;
        const oUpdateSet = _.omit(oItem, [
            'ITEM_ID',
            'CALCULATION_VERSION_ID',
            'SESSION_ID'
        ]);
        const aColumnNames = _.keys(oUpdateSet);

        // determine all possible custom fields
        const aAllCustomFields = await determineAllCustomFields();

        // determine which custom fields are set in the items
        const aCustomFields = [];
        _.each(aAllCustomFields, function (sCustomField, iIndex) {
            if (_.has(oItem, sCustomField)) {
                aCustomFields.push(sCustomField);
            }
        });

        const aStandardFields = _.difference(aColumnNames, aCustomFields);
        let iUpdatedItem = 0;
        let iUpdatedItemExt = 0;

        // update standard fields
        if (aStandardFields.length !== 0) {
            iUpdatedItem = await updateItemTable(aStandardFields, oItem, sSessionId);

        }

        // insert or update custom fields
        if (aCustomFields.length !== 0 && bUpdateOnlyStandardFields !== true) {
            iUpdatedItemExt = await upsertItemExtensionTable(aCustomFields, oItem, sSessionId);
        }

        if (_.has(oItem, 'PREDECESSOR_ITEM_ID')) {
            // in case a new predecessor item is set, the former successor for
            // the item must be updated
            await updateSuccessor(oItem, sSessionId);
        }

        if (iUpdatedItem > 0 || iUpdatedItemExt > 0)
            return 1;
        else
            return 0;
    };

    /**
	 * Helper function to do a mass update of items, both in t_item_temporary and t_item_temporary_ext tables
	 * depending on sTableName and aUpdateFields parameters.
	 * 
	 * @param {array} aItems        Array of Item objects. All Item objects must have the same set of properties.
	 * @param {string} sTableName   Table to update, t_item_temporary or t_item_temporary_ext.
	 * @param {string} sSessionId   The session id with which the items to update are associated.
	 * @param {array} aUpdateFields Array for property/column names which should be updated.
	 */
    function executeItemMassUpdate(aItems, sTableName, sSessionId, aUpdateFields) {
        const sFieldUpdates = aUpdateFields.map(field => field + '=?').join(',');
        const sUpdateStatement = `update "${ sTableName }" set ${ sFieldUpdates }
			where item_id=? and calculation_version_id=? and session_id=?`;
        const aUpdateValues = [];
        aItems.forEach(item => {
            const row = [];
            aUpdateFields.forEach(field => row.push(item[field]));
            row.push(item.ITEM_ID), row.push(item.CALCULATION_VERSION_ID);
            row.push(sSessionId);
            aUpdateValues.push(row);
        });
        await dbConnection.executeUpdate(sUpdateStatement, aUpdateValues);
    }

    /**
	 * Updates an array of items. Each property of the given JavaScript object is matched to columns of the table. The property value is written to the
	 * table for the corresponding column. A column is only affected if the JS object contains a property with the column name. If a value
	 * should be deleted from a column, the corresponding property in the JS object must have <code>null</code> as value.
	 *
	 * The properties ITEM_ID and CALCULATION_VERSION_ID, together with the function parameter for the session are used to identify the
	 * entity, which is affected by the update statement. These properties cannot be changed by this function and the given JS object must
	 * contain them.
	 * 
	 * TODO: massUpdate currently does not update PREDECESSOR_ITEM_ID of items in the database but not contained in aItems.
	 *       This logic is rather complex and would be a new feature.
	 *
	 * @param {array} aItems - The JS object containing the new values for an item entity. Property names have to match the columns of
	 *            t_item_temporary and property values are written to the table.
	 * @param {string} sSessionId - The session id with which the item to update is associated
	 */
    this.massUpdate = async function (aItems, sSessionId) {
        // To make sure that "ITEM_ID", "CALCULATION_VERSION_ID", "SESSION_ID" are not updated,
        // the properties are removed from the object before the SQL statement is generated.
        const oUpdateSet = _.omit(aItems[0], [
            'ITEM_ID',
            'CALCULATION_VERSION_ID',
            'SESSION_ID'
        ]);
        const aColumnNames = _.keys(oUpdateSet);

        // determine all possible custom fields
        const aAllCustomFields = await determineAllCustomFields();

        // determine which custom fields are set in the items
        const aCustomFields = [];
        _.each(aAllCustomFields, function (sCustomField, iIndex) {
            if (_.has(aItems[0], sCustomField)) {
                aCustomFields.push(sCustomField);
            }
        });

        const aStandardFields = _.difference(aColumnNames, aCustomFields);

        // update standard fields
        if (aStandardFields.length > 0) {
            await executeItemMassUpdate(aItems, Tables.item_temporary, sSessionId, aStandardFields);
        }

        // update custom fields
        if (aCustomFields.length > 0) {
            await executeItemMassUpdate(aItems, Tables.item_temporary_ext, sSessionId, aCustomFields);
        }
    };

    /**
	 * Updates t_item_temporary table.
	 *
	 * @param {array}
	 *            aStandardFields - Array containing the fields that should be updated.
	 *
	 * @param {object}
	 *            oItem - The JS object containing the new values for an item entity.
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 *
	 * @returns {integer} - 1 if an entity was updated or 0 if no row was affected by the update. This usually indicates that an item with
	 *          the specified item and version id is not contained in t_item_temporary
	 */
    async function updateItemTable(aStandardFields, oItem, sSessionId) {
        var aStmtBuilder = ['update "' + Tables.item_temporary + '" set '];
        var aValues = [];
        _.each(aStandardFields, function (sColumnName, iIndex) {
            if (oItem[sColumnName] instanceof Date) {
                aStmtBuilder.push(sColumnName + ' = TO_TIMESTAMP(?)');
            } else {
                aStmtBuilder.push(sColumnName + ' = ?');
            }

            aValues.push(oItem[sColumnName]);
            if (iIndex < aStandardFields.length - 1) {
                aStmtBuilder.push(', ');
            }
        });
        aStmtBuilder.push(' where session_id = ? and item_id = ? and calculation_version_id = ?');

        aValues.push(sSessionId);
        aValues.push(oItem.ITEM_ID);
        aValues.push(oItem.CALCULATION_VERSION_ID);
        var updateStmt = hQuery.statement(aStmtBuilder.join(''));

        var iAffectedRows = await updateStmt.execute(aValues);

        if (iAffectedRows > 1) {
            const sClientMsg = `Corrupted query or database state: modified ${ iAffectedRows } database records in ${ Tables.item_temporary } during the update of item.`;
            const sServerMsg = `${ sClientMsg } Item id: ${ oItem.ITEM_ID }, data : ${ JSON.stringify(oItem) }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return iAffectedRows;

    }

    /**
	 * Upsert t_item_temporary_ext table. An entry in extension table is created only when the first custom field is set.
	 *
	 * @param {array}
	 *            aCustomFields - Array containing the fields that should be updated.
	 *
	 * @param {object}
	 *            oItem - The JS object containing the new values for an item entity.
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 *
	 * @returns {integer} - 1 if an entity was updated/created or 0 if no row was affected by the upsert.
	 */
    async function upsertItemExtensionTable(aCustomFields, oItem, sSessionId) {

        var aValuesCust = [];
        aValuesCust.push(sSessionId);
        aValuesCust.push(oItem.CALCULATION_VERSION_ID);
        aValuesCust.push(oItem.ITEM_ID);

        var aStmtBuilderCustColumns = ['upsert "' + Tables.item_temporary_ext + '" ( SESSION_ID, CALCULATION_VERSION_ID, ITEM_ID, '];
        var aStmtBuilderValues = [') VALUES ( ?, ?, ?, '];
        _.each(aCustomFields, function (sColumnName, iIndex) {
            aStmtBuilderCustColumns.push(sColumnName);
            aStmtBuilderValues.push('? ');
            aValuesCust.push(oItem[sColumnName]);
            if (iIndex < aCustomFields.length - 1) {
                aStmtBuilderCustColumns.push(', ');
                aStmtBuilderValues.push(', ');
            }
        });

        aStmtBuilderValues.push(') WITH PRIMARY KEY');
        aStmtBuilderCustColumns = aStmtBuilderCustColumns.concat(aStmtBuilderValues);

        var upsertStmt = hQuery.statement(aStmtBuilderCustColumns.join(''));
        var iAffectedRows = await upsertStmt.execute(aValuesCust);

        if (iAffectedRows > 1) {
            const sClientMsg = `Corrupted query or database state: modified ${ iAffectedRows } database records in ${ Tables.item_temporary_ext } during the update of item.`;
            const sServerMsg = `${ sClientMsg } Item id:  ${ oItem.ITEM_ID }, data : ${ JSON.stringify(oItem) }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return iAffectedRows;

    }

    /**
	 * Sets items in master calculation versions to reference existing calculation versions (set item category
	 * 		and referenced calculation version fields,
	 * 		copy values from source (and its root item) to item in master calculation version in both t_item_temporary and t_item_temporary_ext)
	 *
	 * @param {array}
     *      aItemToUpdateReferencedVersion: An array containing all reference version items to be updated
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 */
    this.updateReferencedCalculationVersionID = async function (aItemToUpdateReferencedVersion, sSessionId) {

        if (helpers.isNullOrUndefined(aItemToUpdateReferencedVersion) || aItemToUpdateReferencedVersion.length < 1) {
            const sLogMessage = 'aItemToUpdateReferencedVersion must be an array with at least one entry.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        //insert items into temporary table so that they can be used by the procedure
        var aStmtBuilder = [`insert into "${ Tables.gtt_reference_calculation_version_items }"`];
        aStmtBuilder.push('(ITEM_ID, CALCULATION_VERSION_ID, REFERENCED_CALCULATION_VERSION_ID ,ITEM_CATEGORY_ID, ACCOUNT_ID) ');
        aStmtBuilder.push('VALUES (?,?,?,?,?) ');

        // in order to enable batch insert of items, the values of aItems must be converted in an array of arrays
        var aInsertValues = [];
        _.each(aItemToUpdateReferencedVersion, function (oItemToUpdateReferencedVersion) {
            var aItemValues = [];
            aItemValues.push(oItemToUpdateReferencedVersion.ITEM_ID);
            aItemValues.push(oItemToUpdateReferencedVersion.CALCULATION_VERSION_ID);
            aItemValues.push(oItemToUpdateReferencedVersion.REFERENCED_CALCULATION_VERSION_ID);
            aItemValues.push(oItemToUpdateReferencedVersion.ITEM_CATEGORY_ID);
            aItemValues.push(oItemToUpdateReferencedVersion.ACCOUNT_ID);

            aInsertValues.push(aItemValues);
        });
        var sStmt = aStmtBuilder.join(' ');
        try {
            await dbConnection.executeUpdate(sStmt, aInsertValues);
        } catch (e) {
            const sClientMsg = `Error while filling temporary table ${ Tables.gtt_reference_calculation_version_items }.`;
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        //invoke procedure to set reference versions values	
        try {
            var fnUpdateReferencedCalcVer = dbConnection.loadProcedure(Procedures.update_referenced_calc_version);
            var oResult = fnUpdateReferencedCalcVer(sSessionId);
        } catch (e) {
            const sClientMsg = `Error while executing procedure ${ Procedures.update_referenced_calc_version }.`;
            const sServerMsg = `${ sClientMsg } Error: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

        //throw exception if at least one source calculation version does not exist
        if (oResult.OV_NOT_EXISTING_VERSIONS.length !== 0) {
            const aVersionIds = [];
            var oCvNotFoundDetails = new MessageDetails();
            _.each(oResult.OV_NOT_EXISTING_VERSIONS, function (oVersion) {
                oCvNotFoundDetails.addCalculationVersionObjs({ id: oVersion.CALCULATION_VERSION_ID });
                aVersionIds.push(oVersion.CALCULATION_VERSION_ID);
            });

            const sClientMsg = `Error while setting the referenced calculation versions: some calculation versions not found.`;
            const sServerMsg = `${ sClientMsg } Not existent versions are : ${ aVersionIds.join(',') }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oCvNotFoundDetails);
        }

        //throw exception if at least one source calculation version is not current
        if (oResult.OV_SOURCE_CALCULATION_VERSIONS_NOT_CURRENT.length !== 0) {
            const aVersionIds = [];
            var oCvIsNotCurrentDetails = new MessageDetails();
            _.each(oResult.OV_SOURCE_CALCULATION_VERSIONS_NOT_CURRENT, function (oVersion) {
                oCvIsNotCurrentDetails.addCalculationVersionObjs({ id: oVersion.CALCULATION_VERSION_ID });
                aVersionIds.push(oVersion.CALCULATION_VERSION_ID);
            });

            const sClientMsg = `Error while setting the referenced calculation versions: some calculation versions not current.`;
            const sServerMsg = `${ sClientMsg } Not current versions are : ${ aVersionIds.join(',') }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_CURRENT_ERROR, sClientMsg, oCvIsNotCurrentDetails);
        }

    };

    /**
	 * Executes the procedure p_item_automatic_value_determination in order to execute price and account determination, set the dependent
	 * fields and copy master data from ERP to PLC tables. It returns an array containing the items (type t_item_temporary), if there were
	 * any determined values for the item.
	 *
	 * @param {array}
	 *            aItems - Set of items for which the value determination shall be executed; if an item in the array is lacking a property
	 *            that is required by the table table t_item_tempoary, this object is filled with this property (value: <code>null</code>)
	 * @param {integer}
	 *            iCvId - Calculation version that contains ALL items of the input array
	 * @param {string}
	 *            sSessionId - Current session id
	 * @param {boolean}
	 * 			  bImport - Indicating if the procedure shall be called in import mode; parameter is passed to price determination
	 * @param {boolean}
	 * 			 [bReevaluate] - Optional parameter to set the procedure in re-evalution mode for the the account determination. If set to true
	 * 							 the account determination will consider all given items and not only the items with changes on account determination
	 * 							 relevant properties (material_id, plant_id, process_id, activity_type_id). This would override manually
	 * 							 entered accounts for the given items. If the value is false, the change detection of the procedure is enabled and only
	 * 							 the automatic account determination is executed for items with changes on relevant properties. The default value
	 * 							 is false.
	 * @returns {array} An array that contains an object of type t_item_temporary for every item any value could be determined.
	 */
    this.automaticValueDetermination = async function (aItems, iCvId, sSessionId, bImport, bReevaluate) {
        var sImportFlag = bImport === true ? 'X' : '';
        // not sure why, but somehow boolean parameters must be provided as strings
        var sReevaluate = bReevaluate !== undefined ? bReevaluate : false;
        try {

            var aTableColumns = helper.getColumnsForTable(Tables.gtt_item_temporary_with_masterdata_custom_fields);
            var aStmtBuilder = [`insert into "${ Tables.gtt_item_temporary_with_masterdata_custom_fields }"`];
            aStmtBuilder.push('(' + aTableColumns.join(',') + ')');
            var aValuePlaceHolder = _.map(aTableColumns, function () {
                return '?';
            });
            aStmtBuilder.push('VALUES (' + aValuePlaceHolder.join(',') + ')');

            // in order to enable batch insert of items, the values of aItems must be converted in an array of arrays
            var aInsertValues = [];
            _.each(aItems, function (oItem) {
                var aItemValues = [];
                _.each(aTableColumns, function (sColumnName) {
                    // objects in aItems normally don't contain SESSION_ID; set in the value array for this reason
                    if (sColumnName === 'SESSION_ID') {
                        aItemValues.push(sSessionId);
                    } else if (sColumnName === 'CALCULATION_VERSION_ID') {
                        aItemValues.push(iCvId);
                    } else if (_.has(oItem, sColumnName)) {
                        aItemValues.push(oItem[sColumnName]);
                    } else {
                        aItemValues.push(null);
                    }
                });
                aInsertValues.push(aItemValues);
            });

            var sStmt = aStmtBuilder.join(' ');
            await dbConnection.executeUpdate(sStmt, aInsertValues);

            var fnDetermination = dbConnection.loadProcedure(Procedures.value_determination);
            var oResult = fnDetermination(iCvId, sSessionId, sImportFlag, sReevaluate, false);
            return {
                VALUES: Array.slice(oResult.OT_ITEMS),
                MESSAGES: Array.slice(oResult.OT_MESSAGES)
            };
        } catch (e) {
            const sClientMsg = 'Error while running automatic value determination for items.';
            const sServerMsg = `${ sClientMsg } Item ids: ${ _.map(aItems, 'ITEM_ID').join(',') }. Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };

    /**
	 * Create new item in database
	 *
	 * @param {array}
	 *            aItems - the object with the properties of the new item from request
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {integer}
	 *            iCvId - calculation version id used for all created items
	 * @param {integer}
	 *            iImport - import flag
	 * @param {integer}
	 * 			  iSetDefaultValues - flag for setting the default values in the procedure
	 * @param {integer}
	 * 			  iUpdateMasterDataAndPrices - flag for triggering price & account determination in the procedure
	 * @returns {object} oResultSet - created item
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.create = async function (aItems, sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices, bCompressedResult) {

        if (aItems.length === 0) {
            return {
                OT_NEW_ITEMS: [],
                OT_UPDATED_ITEMS: [],
                OT_MESSAGES: []
            };
        }

        let aCustomFieldItems = [];
        let oMasterdataCustomFields = metadata.getMasterdataCustomFields();
        for (let i = 0; i < oMasterdataCustomFields.DEFAULT_VALUES.length; i++) {
            if (oMasterdataCustomFields.DEFAULT_VALUES[i] !== null) {
                if (oMasterdataCustomFields.DATA_TYPES[i] === 'Integer' || oMasterdataCustomFields.DATA_TYPES[i] == 'BooleanInt') {
                    oMasterdataCustomFields.DEFAULT_VALUES[i] = parseInt(oMasterdataCustomFields.DEFAULT_VALUES[i]);
                } else if (oMasterdataCustomFields.DATA_TYPES[i] === 'Decimal') {
                    oMasterdataCustomFields.DEFAULT_VALUES[i] = parseFloat(oMasterdataCustomFields.DEFAULT_VALUES[i]);
                }
            }
        }
        const aMasterdataCustomFields = oMasterdataCustomFields.COLUMNS;

        try {

            var aTableColumns = helper.getColumnsForTable(Tables.gtt_item_temporary);
            var aStmtBuilder = [`insert into "${ Tables.gtt_item_temporary }"`];
            aStmtBuilder.push('(' + aTableColumns.join(',') + ')');
            var aValuePlaceHolder = _.map(aTableColumns, function () {
                return '?';
            });
            aStmtBuilder.push('VALUES (' + aValuePlaceHolder.join(',') + ')');

            // in order to enable batch insert of items, the values of aItems must be converted in an array of arrays
            var aInsertValues = [];
            _.each(aItems, function (oItem) {
                var aItemValues = [];
                _.each(aTableColumns, function (sColumnName) {
                    // objects in aItems normally don't contain SESSION_ID; set in the value array for this reason
                    if (sColumnName === 'SESSION_ID') {
                        aItemValues.push(sSessionId);
                    } else if (sColumnName === 'CALCULATION_VERSION_ID') {
                        aItemValues.push(iCvId);
                    } else if (_.has(oItem, sColumnName)) {
                        var iIndex = aMasterdataCustomFields.indexOf(sColumnName);
                        if (iIndex !== -1) {
                            if (!_.has(aCustomFieldItems, sColumnName)) {
                                aCustomFieldItems[sColumnName] = [];
                            }
                            if (_.isNull(oItem[sColumnName]) && (sColumnName.endsWith('_UNIT') || oMasterdataCustomFields.DATA_TYPES[iIndex] === 'BooleanInt')) {
                                oItem[sColumnName] = oMasterdataCustomFields.DEFAULT_VALUES[iIndex];
                            }
                            aCustomFieldItems[sColumnName].push({
                                ITEM_ID: oItem.ITEM_ID,
                                VALUE: oItem[sColumnName]
                            });
                        }
                        aItemValues.push(oItem[sColumnName]);
                    } else {
                        if (sColumnName === 'IS_DISABLING_ACCOUNT_DETERMINATION') {
                            aItemValues.push(0);
                        } else {
                            aItemValues.push(null);
                        }
                    }
                });
                aInsertValues.push(aItemValues);
            });

            var sStmt = aStmtBuilder.join(' ');
            await dbConnection.executeUpdate(sStmt, aInsertValues);


            var fnCreate = dbConnection.loadProcedure(Procedures.create_item);
            var oResult = fnCreate(sSessionId, iCvId, iImport, iSetDefaultValues, iUpdateMasterDataAndPrices);

        } catch (e) {
            const sClientMsg = 'Error while creating items.';
            const sServerMsg = `${ sClientMsg } Item ids: ${ aItems.join(',') }. Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        //throw exception if at least one source calculation version doesn't exist
        if (oResult.OV_NOT_EXISTING_VERSIONS.length !== 0) {
            const aVersions = _.map(oResult.OV_NOT_EXISTING_VERSIONS, 'CALCULATION_VERSION_ID');

            const sClientMsg = 'Error while setting the referenced calculation versions.';
            const sServerMsg = `${ sClientMsg } Not existent versions: ${ aVersions.join(', ') }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        //throw exception if subitems were added to items of type text or referenced version
        if (oResult.OV_ITEMS_WITH_FORBIDDEN_SUBITEMS.length !== 0) {
            const aItems = _.map(oResult.OV_ITEMS_WITH_FORBIDDEN_SUBITEMS, 'ITEM_ID');

            const sClientMsg = "Items of types 'text' or 'referenced version' cannot have subitems.";
            const sServerMsg = `${ sClientMsg } Item ids: ${ aItems.join(', ') }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg);
        }

        if (Object.keys(aCustomFieldItems).length > 0) {
            aItems = _.filter(aItems, item => {
                return _.some(aMasterdataCustomFields, sProperty => _.has(item, sProperty)) === true;
            });//this is done in order to avoid unnecessary updates for items with no custom field set in the request
            //add masterdata custom fields which were not sent in request as properties of aItems so that a consistent structure is maintained in order to do a mass update
            _.each(oResult.OT_NEW_ITEMS, oItem => {
                let itemIndex = aItems.findIndex(item => item.ITEM_ID === oItem.HANDLE_ID);
                if (itemIndex !== -1) {
                    aItems[itemIndex].ITEM_ID = oItem.ITEM_ID;
                    aMasterdataCustomFields.forEach(sCustomField => {
                        if (!_.has(aItems[itemIndex], sCustomField)) {
                            aItems[itemIndex][sCustomField] = oItem[sCustomField];
                        }
                    });
                }
            });
            await executeItemMassUpdate(aItems, Tables.item_temporary_ext, sSessionId, aMasterdataCustomFields);
        }

        oResult.OT_CUSTOM_FIELDS_FROM_REQUEST = aCustomFieldItems;

        return oResult;
    };

    /**
	 * Deletes all items in temporary and persistent tables that are marked for deletion.
	 *
	 * @param sSessionId
	 *            {string} ID of the session, in which items shall be deleted
	 * @param iCalculationVersionID
	 *            {integer} ID of the calculation version, in which items are to be deleted.
	 */
    this.deleteItems = async function (sSessionId, iCalculationVersionID) {
        oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionID });

        if (!await _.isNumber(iCalculationVersionID)) {
            const sLogMessage = 'iCalculationVersionID must be a number.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        try {
            var fnDelete = dbConnection.loadProcedure(Procedures.delete_items_marked_for_deletion);
            var oResult = fnDelete(sSessionId, iCalculationVersionID);
        } catch (e) {
            const sClientMsg = `Error while executing procedure ${ Procedures.delete_items_marked_for_deletion }.`;
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }

    };

    /**
	 * Determines if given item has children.
	 *
	 * @param {object}
	 *            oItem - containing at least the properties ITEM_ID and CALCULATION_VERSION_ID to identifiy the item which shall be checked
	 *            for existing children
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 * @param {string}
	 *            sUserId - The user with whom the item to update is associated
	 *
	 * @throws {PlcException} -
	 *             If oItem, sSesssioId or sUserId are not correctly set
	 *
	 * @return true if the item with the given id and calculation version has children, false otherwise
	 *
	 */
    this.hasItemChildren = async function (oItem, sSessionId) {
        oMessageDetails.addCalculationVersionObjs({ id: oItem.CALCULATION_VERSION_ID });
        oMessageDetails.addItemObjs({ id: oItem.ITEM_ID });

        if (!helpers.isPlainObject(oItem)) {
            const sLogMessage = 'oItem must be an object.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }
        if (!_.isString(sSessionId)) {
            const sLogMessage = 'sSessionId must be a string.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage, oMessageDetails);
        }

        // This considers the is_deleted property in t_item_temporary, because
        // deleted items are only flagged in db and not deleted.
        const sStmt = `select top 1 item_id 
		                from "sap.plc.db::basis.t_item_temporary" 
		                where parent_item_id = ? 
		                    and calculation_version_id = ? 
		                    and session_id = ? 
		                    and is_deleted = 0
		`;
        var aDirectChildrenIds = await hQuery.statement(sStmt).execute(oItem.ITEM_ID, oItem.CALCULATION_VERSION_ID, sSessionId);
        return aDirectChildrenIds.length > 0;
    };

    /**
	 * Marks an item and its children to be deleted (actual deletion will happen at "save")
	 *
	 * @param {string}
	 *            sSessionId - the session id
	 * @param {string}
	 *            iItemId - the id of item to be deleted
	 * @returns {object} result - the result object result.CALCULATION_VERSION_ID - id of corresponding calculation version
	 *          result.DELETED_ITEM_COUNT - 1 if the item to delete was found, 0 if not
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.markItemForDeletion = async function (sSessionId, oBodyItem, bDeleteRoot) {
        var result = {};
        result.DELETED_ITEM_COUNT = 0;

        try {
            var procedure = dbConnection.loadProcedure(Procedures.delete_item);
            var procresult = procedure(sSessionId, oBodyItem.ITEM_ID, oBodyItem.CALCULATION_VERSION_ID, bDeleteRoot ? 1 : 0);

            result.CALCULATION_VERSION_ID = procresult.OV_CALCULATION_VERSION_ID;
            result.DELETED_ITEM_COUNT = procresult.OV_ITEM_COUNT;
        } catch (e) {
            const sClientMsg = 'Error during marking item for deletion.';
            const sServerMsg = `${ sClientMsg } Item id: ${ oBodyItem.ITEM_ID }. Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, null, null, e);
        }
        return result;
    };

    /**
	 * This function calculates and sets the the correct active state of items inside a calculation version. It must be provided with
	 * set of items of the calculation version that changed their active state and calculates the correct active for potential child and parent
	 * items. The input is required to avoid ambiguity in the setting of the active state and for the sake of performance.
	 *
	 * @param {array}
	 *            aItems 	An array of the items objects with the changed active state. Each object must contain at least the following properties:
	 * 						ITEM_ID, PARENT_ITEM_ID, IS_ACTIVE. The value provided for IS_ACTIVE is the one taken for the calculation of the active state
	 * 						no matter what value is present in t_item_temporary for this item.
	 * @param {integer}
	 *            iCvId		The id of the calculation version all items provided for aItems must be in.
	 * @param {string}
	 *            sSession  The session id the user has opened the calculation version.
	 *
	 * @return {array}		An array with objects contaning only the item id ([{ITEM_ID : 123, ...}]) for each items with an updated active state.
	 */
    this.setActiveStates = function (aItems, iCvId, sSessionId) {
        if (aItems.length === 0) {
            return {
                NEW_ITEMS: [],
                UPDATED_ITEMS: [],
                MESSAGES: []
            };
        }

        // insert into gtt_item_changed_active_state
        var aValues = _.map(aItems, function (oItem) {
            return [
                oItem.ITEM_ID,
                oItem.PARENT_ITEM_ID,
                oItem.IS_ACTIVE
            ];
        });
        var sInsertStmt = `insert into "${ Tables.gtt_item_changed_active_state }" values(?,?,?)`;
        await dbConnection.executeUpdate(sInsertStmt, aValues);

        var fSetActiveStates = dbConnection.loadProcedure(Procedures.set_active_states);
        // currently there is no use case, for preserving the active state of substructures from XS; for this reason, it's always set to 0
        // if this changes, the signature of the function can be changed to give the business logic the opportuinity to change it
        const iPreserveSubstructureFlag = 0;
        var oProcedureResult = fSetActiveStates(iCvId, sSessionId, iPreserveSubstructureFlag);
        return oProcedureResult.ITEM_IDS_UPDATED;
    };


    /**
	 * Set TRANSACTION_CURRENCY_ID for all assembly items.
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 * @param {integer}
	 *            iCalculationVersionId - the calculation version id
	 * @param {string}
	 *            sPriceTransactionCurrencyId - The new price transaction currency id
	 *
	 * @return true if the TRANSACTION_CURRENCY_ID of the item with the given id and calculation version was updated, false otherwise
	 *
	 */
    this.setPriceTransactionCurrencyForAssemblyItems = function (sSessionId, iCalculationVersionId, sPriceTransactionCurrencyId) {


        /**
		 * Set reporting currency of the calculation versions to all assembly items with custom 
		 * fields with currency unit
		 */
        const fnSet = dbConnection.loadProcedure(Procedures.set_reporting_currency_item_custom_fields);
        fnSet(sSessionId, iCalculationVersionId, sPriceTransactionCurrencyId);

    };

    this.setHQuery = function (oHQuery) {
        hQuery = oHQuery;
    };

    /**
	 * Add to the global table send to the calcengine the IDs of the changed items.
	 *
	 * @param {array}
	 *            aItems - array containing the IDs of the changed items
	 *
	 */
    this.insertChangedItemIdForAFL = async function (aItems) {

        var aValues = _.map(aItems, function (oItem) {
            return [
                oItem.ITEM_ID,
                null
            ];
        });
        var sInsertStmt = `insert into "${ Tables.gtt_changed_items }" values(?,?)`;
        try {
            await dbConnection.executeUpdate(sInsertStmt, aValues);
        } catch (e) {
            const sClientMsg = `Error while filling temporary table ${ Tables.gtt_changed_items }.`;
            const sServerMsg = `${ sClientMsg } Error message: ${ e.message || e.msg }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg, oMessageDetails);
        }
    };

    /**
	 * Set PRICE for item.
	 *
	 * @param {string}
	 *            sSessionId - The session id with which the item to update is associated
	 * @param {integer}
	 *            iCalculationVersionId - the calculation version id
	 * @param {string}
	 *            sItemId - The item id
	 *
	 * @return table with material price and activity price + other masterdata
	 *
	 */

    this.getPricesForItem = function (sSessionId, iCalculationVersionId, iItemId, sSessionLanguage) {
        var oResultMasterdata = {};
        var fnReadProcedure = dbConnection.loadProcedure(Procedures.get_prices_for_item);
        var oReadResult = fnReadProcedure(sSessionId, iCalculationVersionId, iItemId, sSessionLanguage);

        oResultMasterdata[BusinessObjectsEntities.MATERIAL_PRICE_ENTITIES] = Array.slice(oReadResult.OT_ALL_PRICES_MATERIAL);
        oResultMasterdata[BusinessObjectsEntities.ACTIVITY_PRICE_ENTITIES] = Array.slice(oReadResult.OT_ALL_PRICES_ACTIVITY);
        oResultMasterdata[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = Array.slice(oReadResult.OT_ACTIVITY_TYPE);
        oResultMasterdata[BusinessObjectsEntities.MATERIAL_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL);
        oResultMasterdata[BusinessObjectsEntities.MATERIAL_GROUP_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL_GROUP);
        oResultMasterdata[BusinessObjectsEntities.MATERIAL_TYPE_ENTITIES] = Array.slice(oReadResult.OT_MATERIAL_TYPE);
        oResultMasterdata[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(oReadResult.OT_PLANT);
        oResultMasterdata[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(oReadResult.OT_COMPANY_CODE);
        oResultMasterdata[BusinessObjectsEntities.COST_CENTER_ENTITIES] = Array.slice(oReadResult.OT_COST_CENTER);
        oResultMasterdata[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(oReadResult.OT_CONTROLLING_AREA);
        oResultMasterdata[BusinessObjectsEntities.VENDOR_ENTITIES] = Array.slice(oReadResult.OT_VENDOR);
        oResultMasterdata[BusinessObjectsEntities.CUSTOMER_ENTITIES] = Array.from(oReadResult.OT_CUSTOMER);
        oResultMasterdata[BusinessObjectsEntities.PRICE_COMPONENT_ENTITIES] = Array.from(oReadResult.OT_PRICE_COMPONENTS);

        return {
            masterdata: oResultMasterdata,
            transactionaldata: Array.slice(oReadResult.OT_PROJECT)
        };

    };

    /**
	 * Gets first record from t_price_source for a given source_type
	 *
	 * @param {integer}
	 *            iPriceSourceType - source_type id 
	 *
	 * @return table with only one record containing first price_source_id found for the given price_source_type_id
	 *
	 */
    this.getPriceSourceBySourceType = async function (iPriceSourceType) {
        var sStmt = ['select top 1 price_source_id from "' + Tables.price_source + '"  where price_source_type_id = ?'].join(' ');
        var aPriceSourceIds = await hQuery.statement(sStmt).execute(iPriceSourceType);
        if (aPriceSourceIds.length === 0) {
            const sLogMessage = `There is no price source defined for price source type ${ iPriceSourceType }`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        return aPriceSourceIds;
    };

    /**
     * Get valid existing material id and base uom id under the consideration of a given master data timestamp.
     *
     * @param dMasterdataTimestamp Timestamp defining the point in time the return unit of measures are valid
	 * @param aMaterialIds array of the material ids to search for
     * @return ResultSet object containing the found entities.
     */
    this.getExistingMaterialBaseUomIds = function (dMasterdataTimestamp, aMaterialIds) {
        return await dbConnection.executeQuery(`
            select material_id, base_uom_id from "${ Tables.material }"
            where   _valid_from <= ?
				and (_valid_to > ? or _valid_to is null)
				and material_id in (?)
        `, dMasterdataTimestamp, dMasterdataTimestamp, aMaterialIds.join(','));
    };

    /**
	 * Returns an object that has all item categories as keys and value an object containing all standard and custom fields with
	 * information about defined formulas and rollup types.
	 * Ex
	 * 
	 *	{
	 *		"0" : {
	 *				"FIELD_NAME1": {
	 *					 hasFormula: true,
	 *					 isRolledUp: false
	 *              },
	 *              ... other fields defined for the same item category
	 *     },
	 *     ... other item categories
	 *	}
	 *
	 * @return object with item category -> properties / values described above
	 */
    this.getFormulasAndRollupsForStandardAndCustomFields = function () {
        const aStandardFieldsWithFormulas = Array.from(MapStandardFieldsWithFormulas.keys());
        const sAllStandardFields = aStandardFieldsWithFormulas.map(field => "'" + field + "'").join(',');

        // get all formula-overwritable standard fields and all custom fields names except UNIT fields
        const oAllFields = await dbConnection.executeQuery(`select distinct meta.column_id, attr.item_category_id, rollup_type_id, is_formula_used 
			from "${ Tables.metadata }" meta
				inner join "${ Tables.metadataItemAttributes }" attr 
					on 	meta.column_id = attr.column_id 
					and meta.business_object = attr.business_object 
					and meta.path = attr.path
				left join "${ Tables.formula }" formula 
					on meta.column_id = formula.column_id 
					and meta.business_object = formula.business_object 
					and meta.path = formula.path
					and formula.item_category_id = attr.item_category_id
			where 		meta.path = 'Item'
					and ( (		meta.is_custom = 1 
							and meta.column_id like 'CUST__%' escape '_'
						  ) or meta.column_id in (${ sAllStandardFields })) 
					and (uom_currency_flag is null or uom_currency_flag <> 1)`);

        const definedFormulas = {};
        for (let rowNo in oAllFields) {
            const row = oAllFields[rowNo];
            if (definedFormulas[row.ITEM_CATEGORY_ID] === undefined) {
                definedFormulas[row.ITEM_CATEGORY_ID] = {};
            }
            definedFormulas[row.ITEM_CATEGORY_ID][row.COLUMN_ID] = {
                hasFormula: row.IS_FORMULA_USED === 1,
                isRolledUp: row.ROLLUP_TYPE_ID > 0
            };
        }
        return definedFormulas;
    };


    /**
	* Returns an array containing all distinct parent_item_ids within an (opened) calculation version. Can be used to decide if an item
	* is an assembly or not. The root item's parent_item_id (null) is not included in this array.
	*
	* @return Array containing the ids.
	*/
    this.getParentItemIds = function (iCvId, sSessionId) {
        const oResult = await dbConnection.executeQuery(`select distinct parent_item_id
			from "${ Tables.item_temporary }"
			where 	calculation_version_id = ?
					and session_id = ?
					and parent_item_id is not null
					and is_deleted = 0`, iCvId, sSessionId);
        return Array.from(oResult).map(oRow => oRow.PARENT_ITEM_ID);
    };

    /** 
	*	Returns an array of distinct parents all the way to the root for a given list of items all part of the same calculation version.
	*  	@param iCalculationVersionId	{number} The Id of the calculation version
	*	@param iVersionRootItemId		{number} Calculation version root node Id
	*	@param aListOfItems				{array} Array of items
	*/
    this.getParentsForItems = function (iCalculationVersionId, iVersionRootItemId, aListOfItems) {

        const parentsForItemsWithDuplicates = function (iCalculationVersionId, iVersionRootItemId, aListOfItems) {

            const oResult = await dbConnection.executeQuery(`select distinct parent_item_id 
				from "${ Tables.item }"
				where calculation_version_id = ?
				and parent_item_id IS NOT NULL
				and item_id in (${ aListOfItems.join(',') })`, iCalculationVersionId);

            let aParrentsIds = Array.from(oResult).map(item => item.PARENT_ITEM_ID);

            if (aParrentsIds.length == 0 || aParrentsIds.length == 1 && aParrentsIds[0] === iVersionRootItemId) {
                return aParrentsIds;
            } else {
                return aParrentsIds.concat(parentsForItemsWithDuplicates(iCalculationVersionId, iVersionRootItemId, aParrentsIds));
            }
        };

        return [...new Set(parentsForItemsWithDuplicates(iCalculationVersionId, iVersionRootItemId, aListOfItems))];
    };

    /**
	* Checks an array of ITEM_IDs and returns array of existing and valid ITEM_IDs in the open calculation version.
	* All invalid ITEM_IDs are filtered out in the result.
	*
	* @param aItemIds              {array}  to-be checked item_ids
	* @param iCalculationVersionId {number} calculation version id
	* @param sSessionId            {string} session id
	* @return                      {array}  array of all valid and existing item_ids in the open calculation version
	*/
    this.getValidItemIds = async function (aItemIds, iCalculationVersionId, sSessionId) {
        if (aItemIds.length === 0)
            return aItemIds; // nothing to to if aItemIds is empty
        // To avoid any chance of SQL injection, check that only integers are in the input array
        if (!aItemIds.every(id => Number.isInteger(id))) {
            const sLogMessage = 'aItemIds parameter contains non-integer entries.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        // item_id list in the where condition cannot be passed using SQL parameters ("?")
        // because there is a HANA limit in the maximum number of parameters.
        const oResult = await dbConnection.executeQuery(`select distinct item_id from "${ Tables.item_temporary }"
			 where calculation_version_id = ? and session_id = ? and is_deleted = 0
			 and item_id in (${ aItemIds.join(',') })`, iCalculationVersionId, sSessionId);

        // add all ITEM_IDs returned from the database
        return Array.from(oResult).map(oRow => oRow.ITEM_ID);
    };

    /**
	* Returns an array wich contains the ITEM IDs of all items of category passed as argument
	*
	* @param iItemCategory         {number} Item category wich should be retrieved
	* @param iCalculationVersionId {number} calculation version id
	* @return                      {array}  array of all valid and existing item_ids for category selected
	*/
    this.getItemIdsOfCategory = (iItemCategory, iCalculationVersionId) => {
        const sStmt = ` SELECT ITEM_ID FROM "${ Tables.item }"
					WHERE CALCULATION_VERSION_ID = ? and ITEM_CATEGORY_ID = ?`;
        return Array.from(await dbConnection.executeQuery(sStmt, iCalculationVersionId, iItemCategory));
    };

    /**
	* Returns an array wich contains the ITEM IDs of all items of category passed as argument
	*
	* @param aItemsToUpdate         {array} Array with all the items that should be updated
	*/
    this.setTotalQuantityOfVariants = (iCalculationVersionId, iVariantId) => {
        const sStmt = `update item set TOTAL_QUANTITY_OF_VARIANTS = variantItem.TOTAL_QUANTITY
			from "${ Tables.variant_item }" variantItem inner join "${ Tables.item }" item on item.ITEM_ID = variantItem.ITEM_ID and
			item.CALCULATION_VERSION_ID = ${ iCalculationVersionId } and variantItem.VARIANT_ID = ${ iVariantId }
			`;

        await dbConnection.executeUpdate(sStmt);
    };

    /**
	* Sets TOTAL_QUANTITY_OF_VARIANTS to null 
	*
	* @param iCalculationVersionId         Calculation Version Id
	*/
    this.clearTotalQauntityOfVariants = iCalculationVersionId => {
        const sStmt = `update "${ Tables.item }" set TOTAL_QUANTITY_OF_VARIANTS = NULL 
		where CALCULATION_VERSION_ID = ${ iCalculationVersionId }
			`;

        await dbConnection.executeUpdate(sStmt);
    };

    /**
	 * Get item categories from database
	 *
	 * @returns 	{object} 		- an object with keys `CHILD_ITEM_CATEGORY_ID` and values `ITEM_CATEGORY_ID`
	 * @throws 		{PlcException} 	- if any exceptional state during the communication with the database occurs
	 */
    this.getItemCategories = async function () {
        try {
            const sStmt = ` SELECT ITEM_CATEGORY_ID, CHILD_ITEM_CATEGORY_ID FROM "${ Tables.item_category }"`;
            const oResult = await helpers.transposeResultArray(await dbConnection.executeQuery(sStmt));
            return _.zipObject(oResult.CHILD_ITEM_CATEGORY_ID, oResult.ITEM_CATEGORY_ID);
        } catch (e) {
            const sClientMsg = 'Error while getting item categories.';
            const sServerMsg = `${ sClientMsg }, Error: ${ e.message || e.msg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
    };
}

Item.prototype = Object.create(Item.prototype);
Item.prototype.constructor = Item;

module.exports.Item = Item;
export default {_,helpers,Helper,Metadata,BusinessObjectsEntities,BusinessObjectTypes,MapStandardFieldsWithFormulas,MessageLibrary,PlcException,Code,MessageDetails,Item};
