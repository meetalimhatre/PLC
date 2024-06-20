const Helper = require('./persistency-helper').Helper;
const helpers = require('../util/helpers');
const _ = require('lodash');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const Constants = require('../util/constants');
const CalculationVersionType = Constants.CalculationVersionType;
const VariantMatrixLockContext = Constants.CalculationVersionLockContext.VARIANT_MATRIX;
const VariantItemQuantityState = Constants.VariantItemQuantityState;
const Metadata = require('./persistency-metadata').Metadata;

var Tables = Object.freeze({
    variant: 'sap.plc.db::basis.t_variant',
    variant_temporary: 'sap.plc.db::basis.t_variant_temporary',
    variant_item: 'sap.plc.db::basis.t_variant_item',
    variant_item_temporary: 'sap.plc.db::basis.t_variant_item_temporary',
    calculation_version_item: 'sap.plc.db::basis.t_item',
    calculation_version_item_ext: 'sap.plc.db::basis.t_item_ext',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    open_calculation_versions: 'sap.plc.db::basis.t_open_calculation_versions',
    calculation_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_read'
});

const Sequences = Object.freeze({
    variant_id: 'sap.plc.db.sequence::s_variant_id',
    calculation_version: 'sap.plc.db.sequence::s_calculation_version'
});

const Procedures = Object.freeze({
    p_calculate_variant: 'sap.plc.db.calcengine.procedures::p_calculate_variant',
    p_calculate_sum_variant: 'sap.plc.db.calcengine.procedures::p_calculate_sum_variant'
});
/**
 * Provides persistency operations of variants.
 */
async function Variant($, dbConnection, hQuery) {
    this.helper = new Helper($, hQuery, dbConnection);
    const sUserId = $.getPlcUsername();
    var metadata = new Metadata($, hQuery, dbConnection, sUserId);
    /**
     * t_open_calculation_versions table is a session table that also contains information about non-locking accesses to a calculation version
     * For variant matrix access, we currently do not enter such session information into this table
     * So IS_WRITEABLE is always 1 when the context is "variant_matrix"
     * This function checks if a given calculation version is locked in the context of variant matrix
     * If the given id is found in the t_open_calculation_versions with the given criterias it means that someone else has locked the version
     * @param {integer} iCalculationVersionId - the id of the base version the variant belongs to
     * @returns {boolean} true if the variant is locked, false otherwise
     *
     * REMARK: This check is only working based on the assuption that the SESSION_ID is the same as the USERNAME.
     * This approach was used in order to not change the data model but also have the USERNAME of the locking user.
     */
    this.isLockedInAConcurrentVariantContext = async iCalculationVersionId => {
        const sStmt = `select * from "${ Tables.open_calculation_versions }"
                       where CALCULATION_VERSION_ID = ? 
                       and CONTEXT = ?
                       and SESSION_ID != ?
                       and IS_WRITEABLE = 1 `;
        const oQueryResult = await dbConnection.executeQuery(sStmt, iCalculationVersionId, VariantMatrixLockContext, sUserId);
        return oQueryResult.length > 0;
    };

    /**
     * Gets all variants for a calculation version.
     * @param {integer} iCalculationVersionId - the calculation version id
     * @param {boolean} bCopiedVariantsOnly - if present and true then a new condition is added to the select statement
     *                                       to return only variants that have the LAST_MODIFIED_ON field null
     *
     * @returns {aReturnObject} -  Returns an array containing all the variant objects,
     *                             found in the database for the calculation version.
     */
    this.getVariantsInternal = async function getVariantsInternal(iCalculationVersionId, aVariantIds, bCopiedVariantsOnly) {
        // statement has to use sub-joins in order to determine the last generated version of a variant (if any)
        // this is because of the necessary aggregation by variant_id in t_caculation_version in order to find
        // the lastest generated version for a variant; the inner join must be used to correlate the aggreation
        // result with the calculation_version_id
        let sStmt = `
            select  variant.*,
                    last_generated_version.calculation_version_id as last_generated_version_id,
                    last_generated_version.calculation_id as last_generated_calculation_id
            from "${ Tables.variant }" as variant
                left outer join (                                                -- left outer join here is used because there are variants with out 
                    select  cv.calculation_version_id as calculation_version_id, -- generated versions
                            cv.calculation_id as calculation_id,
                            cv.variant_id as variant_id
                    from "${ Tables.calculation_version }" as cv
                        inner join (
                            select  variant_id,                                 -- group by variant_id and max() determines the last generated version
                                    max(last_modified_on) as latest_LAST_MODIFIED_ON  -- inner join is used to corrolate this result with the version id,
                            from "${ Tables.calculation_version }"                -- which then cann be used for the left outer join on t_variant
                            group by variant_id
                            having variant_id is not null
                        ) as last_generated_variant
                            on  cv.variant_id = last_generated_variant.variant_id 
                            and cv.last_modified_on = last_generated_variant.latest_LAST_MODIFIED_ON
                ) as last_generated_version
                    on variant.variant_id = last_generated_version.variant_id
            where variant.calculation_version_id = ${ iCalculationVersionId }`;

        if (!helpers.isNullOrUndefined(aVariantIds)) {
            // Check that the aItemIds array only contains integers, in order to prevent SQL injection;
            // prepared statement arguments are not used here, for many variants (>2^15) the parameters
            // cannot be used; this is unlikely, but better safe than sorry
            if (!aVariantIds.every(id => Number.isInteger(id))) {
                const sLogMessage = 'aItemIds parameter contains non-integer entries.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
            sStmt += ` and variant.variant_id in (${ aVariantIds.join() })`;
        }

        if (!_.isUndefined(bCopiedVariantsOnly) && bCopiedVariantsOnly === true) {
            sStmt += ` and variant.last_modified_on IS NULL and variant.last_modified_by = ${ `'${ sUserId }'` }`;
        }

        sStmt += ' order by VARIANT_ORDER ';

        const oQueryResult = await dbConnection.executeQuery(sStmt);
        return Array.from(oQueryResult);
    };

    this.getVariants = async function getVariants(iCalculationVersionId, aVariantIds) {
        return await this.getVariantsInternal(iCalculationVersionId, aVariantIds, false);
    };

    /**
     * Gets a variant for a calculation version.
     * @param {integer} iCalculationVersionId - the calculation version id
     * @param {integer} iVariantId - the variant id
     *
     * @returns {oReturnObject} -  Returns a variant object, found in the database for the calculation version
     *                             or undefined if no variant is found.
     */
    this.getVariant = async function getVariant(iCalculationVersionId, iVariantId) {
        const aResult = await this.getVariants(iCalculationVersionId, [iVariantId]);
        // check for inconsistencies in the tables
        if (aResult.length > 1) {
            const sClientMsg = 'Corrupted query or database state: found more than 1 entry for variant id and calculation version id.';
            const sServerMsg = `${ sClientMsg } Variant id: ${ iVariantId }. Calculation version id: ${ iCalculationVersionId }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        const oVariant = _.clone(aResult[0]);
        return oVariant;
    };

    /**
     * Gets the variants that were created when a base version was created as a copy from another version but not saved for the first time.
     *
     * When a calculation version is created as a copy from another version of type "variant base", all the variants are also copied
     * A missmatch between the LAST_MODIFIED_ON field from the copied version and the LAST_MODIFIED_ON from its variants
     * would lead to wrongly set all the items from the variant as outdated.
     * To avoid this, before the initial save of a copied version, all its variants have the LAST_MODIFIED_ON field set to null.
     * Then, when first saving the base version, the LAST_MODIFIED_ON field is updated to have the save value as LAST_MODIFIED_ON from its base version.
     *
     * @param {integer} iCalculationVersionId - the calculation version id that could have copied variants with null as a date
     *
     * @returns {array} -  Returns an array of variants(if any) that belong to the given calculation version id
     *                     and have their LAST_MODIFIED_ON field null
     */
    this.getCopiedVariants = async function getCopiedVariants(iCalculationVersionId) {
        let aVariantIds;
        return await this.getVariantsInternal(iCalculationVersionId, aVariantIds, true);
    };

    /**
     * Gets all items for a variant.
     * @param {integer} iVariantId - the variant id
     * @param {array} aItemIds - (optional) an array of item ids that need to be returned for the given variant id
     *
     * @returns {aReturnObject} -  Returns an array containing all the items,
     *                              found in the database for the variant.
     */
    this.getVariantItems = async function getVariantItems(iVariantId, aItemIds) {
        let sStmt = `select * from "${ Tables.variant_item }" where "VARIANT_ID" = ? `;
        if (!_.isUndefined(aItemIds) && aItemIds.length > 0) {
            sStmt += `and "ITEM_ID" in (${ aItemIds.join() })`;
        }
        const oQueryResult = await dbConnection.executeQuery(sStmt, iVariantId);
        return Array.from(oQueryResult);
    };
    /*
    Remove all temporary transient variants and items from temporary tables when save is pressed
    */
    this.removeTemporaryVariants = async iCalculationVersionId => {
        await dbConnection.executeUpdate(`delete from "${ Tables.variant_temporary }" where CALCULATION_VERSION_ID = ${ iCalculationVersionId } and VARIANT_ID < 0`);
        await dbConnection.executeUpdate(`delete from "${ Tables.variant_item_temporary }" WHERE CALCULATION_VERSION_ID = ${ iCalculationVersionId } and VARIANT_ID < 0`);
    };

    /**
     * Creates a new variant.
     * @param {object} oVariantBody - Variant header object
     *
     * @returns {integer} - Returns the number of affected rows
     *
     */
    this.createVariant = async function createVariant(oVariantHeader, iCalculationVersionId) {
        // remove generated columns from the given object; only as a precaution
        const aRemoveFields = [
            'VARIANT_ID',
            'LAST_GENERATED_VERSION_ID',
            'LAST_GENERATED_CALCULATION_ID'
        ];
        const oInsertObject = _.omit(oVariantHeader, aRemoveFields);
        const iVariantId = this.helper.getNextSequenceID(Sequences.variant_id);
        oInsertObject.CALCULATION_VERSION_ID = iCalculationVersionId;
        const sStmt = `
            insert into "${ Tables.variant }" (
                variant_id,
                ${ Object.keys(oInsertObject).join(', ') }
            )
            values (
                ${ iVariantId },
                ${ Object.keys(oInsertObject).map(() => '?').join(', ') }
            )
        `;
        const sStmtTemp = `
            insert into "${ Tables.variant_temporary }" (
                variant_id,
                ${ Object.keys(oInsertObject).join(', ') }
            )
            values (
                ${ iVariantId },
                ${ Object.keys(oInsertObject).map(() => '?').join(', ') }
            )
        `;
        const aInsertValues = [];
        aInsertValues.push(Object.keys(oInsertObject).map(key => oInsertObject[key]));
        const isCreated = await dbConnection.executeUpdate(sStmt, aInsertValues);
        const isCreatedTemp = await dbConnection.executeUpdate(sStmtTemp, aInsertValues);
        // Return the variant ID if the insert is successful otherwise throw an error
        if (isCreated[0] !== 1) {
            const sClientMsg = 'Error while inserting a new variant.';
            const sServerMsg = `${ sClientMsg } Variant id: ${ iVariantId }. Calculation version id: ${ iCalculationVersionId }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }

        return iVariantId;
    };

    /**
     * Upserts variant items.
     *
     * @param {integer}
     *            iVariantId - the corresponding VARIANT_ID for the variant items that need to be updated
     * @param {array}
     *            aVariantItemsToUpdate - an array of variant items to be updated
     */
    this.upsertVariantItems = async (iVariantId, aVariantItemsToUpsert, iCalculationVersionId) => {
        // RF: decided to hard-code columns of t_variant_item because it's the most performant option and changes to table unlikely
        const aVariantItemKeys = [
            'VARIANT_ID',
            'ITEM_ID',
            'IS_INCLUDED',
            'QUANTITY',
            'QUANTITY_STATE',
            'QUANTITY_UOM_ID',
            'TOTAL_QUANTITY',
            'TOTAL_COST'
        ];

        const sStmt = `
            UPSERT "${ Tables.variant_item }"  
               (${ aVariantItemKeys.join(', ') }) 
            VALUES (${ aVariantItemKeys.map(() => '?').join(', ') })
            WITH PRIMARY KEY;
        `;

        const aValues = aVariantItemsToUpsert.map(oItem => {
            const aItemValues = [];
            aVariantItemKeys.forEach(sProperty => {
                const vValue = _.has(oItem, sProperty) ? oItem[sProperty] : null;
                aItemValues.push(vValue);
            });
            return aItemValues;
        });

        await dbConnection.executeUpdate(sStmt, aValues);

        aVariantItemKeys.push('CALCULATION_VERSION_ID');

        const sStmtTemp = `
            UPSERT "${ Tables.variant_item_temporary }"  
               (${ aVariantItemKeys.join(', ') }) 
            VALUES (${ aVariantItemKeys.map(() => '?').join(', ') })
            WITH PRIMARY KEY;
        `;

        aValues.forEach(aEntry => {
            aEntry.push(iCalculationVersionId);
        });

        await dbConnection.executeUpdate(sStmtTemp, aValues);
    };

    /**
     * Copy the data from t_variant to t_variant_temporary and from t_variant_item to t_variant_item_temporary
     *
     * @param {integer}
     *            iCalculationVersionId - id of the calculation version for which variants are moved to temporary tables
     */
    this.copyToTemporaryTables = async iCalculationVersionId => {
        const aVariantKeys = [
            'VARIANT_ID',
            'CALCULATION_VERSION_ID',
            'VARIANT_NAME',
            'COMMENT',
            'EXCHANGE_RATE_TYPE_ID',
            'TOTAL_COST',
            'REPORT_CURRENCY_ID',
            'SALES_PRICE',
            'SALES_PRICE_CURRENCY_ID',
            'VARIANT_ORDER',
            'IS_SELECTED',
            'VARIANT_TYPE',
            'LAST_REMOVED_MARKINGS_ON',
            'LAST_REMOVED_MARKINGS_BY',
            'LAST_MODIFIED_ON',
            'LAST_MODIFIED_BY',
            'LAST_CALCULATED_ON',
            'LAST_CALCULATED_BY'
        ];
        const aVariantItemKeys = [
            'VARIANT_ID',
            'ITEM_ID',
            'IS_INCLUDED',
            'QUANTITY',
            'QUANTITY_CALCULATED',
            'QUANTITY_STATE',
            'QUANTITY_UOM_ID',
            'TOTAL_QUANTITY',
            'TOTAL_COST'
        ];
        const aVariantIds = dbConnection.executeQuery(`select VARIANT_ID from "${ Tables.variant }" where CALCULATION_VERSION_ID = ${ iCalculationVersionId }`).map(dbObject => dbObject.VARIANT_ID);
        if (aVariantIds.length > 0) {
            const sStmtVariant = `
            UPSERT "${ Tables.variant_temporary }"  
               (${ aVariantKeys.join(', ') })
            SELECT ${ aVariantKeys.join(', ') }
            FROM "${ Tables.variant }"
            WHERE CALCULATION_VERSION_ID = ${ iCalculationVersionId }`;
            const sStmtVariantItem = `
            UPSERT "${ Tables.variant_item_temporary }"  
               (${ aVariantItemKeys.join(', ') }, CALCULATION_VERSION_ID)
            SELECT ${ aVariantItemKeys.join(', ') } , ${ iCalculationVersionId } as CALCULATION_VERSION_ID
            FROM "${ Tables.variant_item }"
            WHERE VARIANT_ID IN (${ aVariantIds.join(', ') })`;
            await dbConnection.executeUpdate(sStmtVariant);
            await dbConnection.executeUpdate(sStmtVariantItem);
        }
    };

    /**
     * Updates a variant (header data). Only variant attributes are updated.
     * The logic is to create a set that contains all the attributes of the request variants
     * in order to create a batch update to work for all the cases
     * In this case if one of the variants from the request won't have one attribute, then it will be set from the database.
     * The VARIANT_ID is removed from the update statement as a precaution measure
     *
     * @param {array}
     *            aVariantsToUpdate - an array of variants that need to be updated
     * @param {array}
     *            aVariantsFromDatabase - an array of variants that are already in the database
     * @param {integer}
     *            iCalculationVersionId - the corresponding CALCULATION_VERSION_ID
     * @param {boolean}
     *            bUpdateOnlyTemporaryTable - true only when the temporary table should be updated
     */
    this.update = async (aVariantsToUpdate, aVariantsFromDatabase, iCalculationVersionId, bUpdateOnlyTemporaryTable = false) => {
        const oColumnsSet = new Set(aVariantsToUpdate.map(oVariant => Object.keys(oVariant)));
        const oColumnSetSorted = oColumnsSet.values().next().value.sort();
        const aSortedColumns = _.without(oColumnSetSorted, 'VARIANT_ID', 'LAST_GENERATED_VERSION_ID', 'LAST_GENERATED_CALCULATION_ID');

        const sStmt = `
            update "${ Tables.variant }" set 
               ${ aSortedColumns.join(' = ?, ') }
               = ? where CALCULATION_VERSION_ID = ? and VARIANT_ID = ?
        `;

        const sStmtTemp = `
            update "${ Tables.variant_temporary }" set 
               ${ aSortedColumns.join(' = ?, ') }
               = ? where CALCULATION_VERSION_ID = ? and VARIANT_ID = ?
        `;

        const aValues = [];
        aVariantsToUpdate.forEach(oVariant => {
            const aVariantValues = [];
            aSortedColumns.forEach(sColumn => {
                if (_.has(oVariant, sColumn)) {
                    aVariantValues.push(oVariant[sColumn]);
                } else {
                    aVariantValues.push(_.find(aVariantsFromDatabase, oExistingVariant => oExistingVariant.VARIANT_ID === oVariant.VARIANT_ID)[sColumn]);
                }
            });
            aVariantValues.push(iCalculationVersionId);
            aVariantValues.push(oVariant.VARIANT_ID);
            aValues.push(aVariantValues);
        });

        if (bUpdateOnlyTemporaryTable === false) {
            await dbConnection.executeUpdate(sStmt, aValues);
        }
        await dbConnection.executeUpdate(sStmtTemp, aValues);
    };

    /**
     * Updates variant items.All items in aVariantItemsToUpdate must have the same properties!
     *
     * @param {integer}
     *            iVariantId - the corresponding VARIANT_ID for the variant items that need to be updated
     * @param {array}
     *            aVariantItemsToUpdate - an array of variant items to be updated
     * @param {boolean}
     *            bUpdateOnlyTemporaryTable - true only when the temporary table should be updated
     */
    this.updateVariantItems = async (iVariantId, aVariantItemsToUpdate, bUpdateOnlyTemporaryTable = false) => {
        // prevent "ITEM_ID", "VARIANT_ID" as primary keys to be part of the updatable properties
        const aUpdateProperties = _.without(Object.keys(aVariantItemsToUpdate[0]), 'ITEM_ID', 'VARIANT_ID');
        const sStmt = `
            update "${ Tables.variant_item }" set 
            ${ aUpdateProperties.sort().join(' = ? , ') }
               = ? where ITEM_ID = ? and VARIANT_ID = ?
        `;

        const sStmtTemp = `
            update "${ Tables.variant_item_temporary }" set 
            ${ aUpdateProperties.sort().join(' = ? , ') }
               = ? where ITEM_ID = ? and VARIANT_ID = ?
        `;

        const aValues = aVariantItemsToUpdate.map(oItem => {
            const aItemValues = [];
            aUpdateProperties.forEach(sProperty => {
                const vValue = _.has(oItem, sProperty) ? oItem[sProperty] : null;
                aItemValues.push(vValue);
            });

            // pushing values for the where clause ITEM_ID = ? and VARIANT_ID = ?
            aItemValues.push(oItem.ITEM_ID);
            aItemValues.push(iVariantId);
            return aItemValues;
        });

        if (bUpdateOnlyTemporaryTable == false) {
            await dbConnection.executeUpdate(sStmt, aValues);
        }
        await dbConnection.executeUpdate(sStmtTemp, aValues);
    };

    /**
     * Gets existing non temporary master data for variants
     * @return {object} all CURRENCIES, EXCHANGE_RATE_TYPES, UNIT_OF_MEASURES for variants as maps to be used in businessObjectValidatorUtils.
     */
    this.getExistingNonTemporaryMasterdata = () => {
        const dMasterdataTimestamp = new Date();
        return {
            CURRENCIES: this.helper.getExistingCurrencies(dMasterdataTimestamp),
            EXCHANGE_RATE_TYPES: this.helper.getExistingExchangeRateTypes(),
            UNIT_OF_MEASURES: this.helper.getExistingUnitOfMeasures(dMasterdataTimestamp)
        };
    };
    /**
     * Gets all the ITEM_IDs of the base version
     * @return {array} - array of ITEM_IDs that belong to a calculation version
     */
    this.getBaseVersionItems = async iCalculationVersionId => {
        const sStmt = `select ITEM_ID from "${ Tables.calculation_version_item }"
              where CALCULATION_VERSION_ID = ?`;

        const oQueryResult = await dbConnection.executeQuery(sStmt, iCalculationVersionId);
        return (helpers.transposeResultArray(oQueryResult)).ITEM_ID || [];
    };

    this.getBaseVersionLastModifiedOn = async iCalculationVersionId => {
        const sStmt = `select LAST_MODIFIED_ON from "${ Tables.calculation_version }"
                    where CALCULATION_VERSION_ID = ?`;

        const oQueryResult = dbConnection.executeQuery(sStmt, iCalculationVersionId);
        return oQueryResult[0].LAST_MODIFIED_ON;
    };

    this.deleteNotMatchingVariantItems = async (iCalculationVersionId, iVariantId) => {
        const sStmt = ` DELETE FROM "${ Tables.variant_item }"
                        WHERE variant_id = ?
                        AND item_id IN (
                            SELECT variant_item.item_id
                                FROM "${ Tables.variant_item }" variant_item
                            LEFT JOIN "${ Tables.calculation_version_item }" calculation_version_item
                                ON variant_item.item_id = calculation_version_item.item_id
                                AND calculation_version_item.calculation_version_id = ?
                            WHERE variant_item.variant_id = ?
                            AND calculation_version_item.item_id IS NULL
                        )`;

        await dbConnection.executeUpdate(sStmt, iVariantId, iCalculationVersionId, iVariantId);
    };

    this.deleteVariant = async (iCalculationVersionId, iVariantId) => {
        const sStmt = ` DELETE FROM "${ Tables.variant }"
                        WHERE CALCULATION_VERSION_ID = ?
                        AND VARIANT_ID = ?`;
        const sStmtTemp = ` DELETE FROM "${ Tables.variant_temporary }"
                        WHERE CALCULATION_VERSION_ID = ?
                        AND VARIANT_ID = ?`;

        await dbConnection.executeUpdate(sStmtTemp, iCalculationVersionId, iVariantId);
        return await dbConnection.executeUpdate(sStmt, iCalculationVersionId, iVariantId);
    };

    this.deleteVariantItems = async iVariantId => {
        const sStmt = ` DELETE FROM "${ Tables.variant_item }"
                        WHERE VARIANT_ID = ?`;
        const sStmtTemp = ` DELETE FROM "${ Tables.variant_item_temporary }"
                        WHERE VARIANT_ID = ?`;
        await dbConnection.executeUpdate(sStmtTemp, iVariantId);
        return await dbConnection.executeUpdate(sStmt, iVariantId);
    };

    this.calculateVariant = async (iCalculationVersionId, aVariants, aVariantItems) => {
        const calculateVariantProcedure = await dbConnection.loadProcedure(Procedures.p_calculate_variant);
        const calculatedResults = calculateVariantProcedure({
            IV_CALCULATION_VERSION_ID: iCalculationVersionId,
            IT_VARIANT_ITEMS: aVariantItems,
            IT_VARIANT_HEADER: aVariants
        });

        return calculatedResults;
    };

    /**
     * Invokes the procedure that calculates the sum variant
     * @param {integer} iCalculationVersionId - id of the calculation version
     * @param {string} sExchangeRateType - id of exchange rate type
     * @param {string} sReportCurrencyId - id of report currency
     * @param {array} aVariants - array with variant ids for which the sum is calculated
     * @return {object} all calculated variants and the sum variant.
     */
    this.calculateSumVariant =async (iCalculationVersionId, sExchangeRateType, sReportCurrencyId, aVariants) => {
        const calculateVariantProcedure = await dbConnection.loadProcedure(Procedures.p_calculate_sum_variant);
        const calculatedResults = calculateVariantProcedure({
            IV_CALCULATION_VERSION_ID: iCalculationVersionId,
            IV_EXCHANGE_RATE_TYPE: sExchangeRateType,
            IV_REPORT_CURRENCY_ID: sReportCurrencyId,
            IT_VARIANT_IDS: aVariants
        });

        return calculatedResults;
    };

    /**
     * Inserts a new calculation version
     * When generating a version from a variant the requested variant and the version base (the base of the requested variant id) will
     * be merged into a new calculation version.
     *
     * @param {integer} iVariantId - id of the variant
     * @param {integer} iCalculationId - id of the calculation
     * @returns {integer} iNextCalculationVersionId - If the generation is successful the new calculation version id is returned, else 0 is returned.
     *
     */
    this.generateCalculationVersion = async (iVariantId, iCalculationId, sCalculationVersionName) => {
        const iNextCalculationVersionId = this.helper.getNextSequenceID(Sequences.calculation_version);
        const sStmt = `
        insert into "${ Tables.calculation_version }"
            (calculation_version_id, calculation_id, calculation_version_name, status_id, calculation_version_type,
            root_item_id, customer_id, sales_document, sales_price, sales_price_currency_id, report_currency_id,
            costing_sheet_id, component_split_id, start_of_production, end_of_production, valuation_date,
            last_modified_on, last_modified_by, master_data_timestamp, 
            lifecycle_period_from, base_version_id, is_frozen, variant_id, exchange_rate_type_id, material_price_strategy_id, activity_price_strategy_id)
        select
            ${ iNextCalculationVersionId } as calculation_version_id,
            ? as calculation_id,
            ? as calculation_version_name,
            calculation_version.status_id,
            ${ CalculationVersionType.GeneratedFromVariant } as calculation_version_type,
            calculation_version.root_item_id,
            calculation_version.customer_id,
            calculation_version.sales_document,
            variant.sales_price as sales_price,
            variant.sales_price_currency_id as sales_price_currency_id,
            variant.report_currency_id as report_currency_id,
            calculation_version.costing_sheet_id,
            calculation_version.component_split_id,
            calculation_version.start_of_production,
            calculation_version.end_of_production,
            calculation_version.valuation_date,
            current_utctimestamp as last_modified_on,
            ? as last_modified_by,
            calculation_version.master_data_timestamp,
            calculation_version.lifecycle_period_from,
            variant.calculation_version_id as base_version_id,
            calculation_version.is_frozen,
            variant.variant_id as variant_id,
            variant.exchange_rate_type_id as exchange_rate_type_id,
            calculation_version.material_price_strategy_id as material_price_strategy_id,
            calculation_version.activity_price_strategy_id as activity_price_strategy_id
        from "${ Tables.variant }" as variant
            inner join "${ Tables.calculation_version }" as calculation_version
                on variant.calculation_version_id = calculation_version.calculation_version_id
            inner join "${ Tables.calculation_with_privileges }" as calculation_with_privileges
                on calculation_version.calculation_id = calculation_with_privileges.calculation_id                                         
                    and calculation_with_privileges.user_id = ?
        where variant.variant_id = ?
        `;

        const iInsertedRowCount = await dbConnection.executeUpdate(sStmt, iCalculationId, sCalculationVersionName, sUserId, sUserId, iVariantId);
        if (iInsertedRowCount !== 1) {
            const sClientMsg = 'Error while generating a new calculation version';
            $.trace.error(sClientMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        return iNextCalculationVersionId;
    };

    /**
     * Inserts calculation version items.
     * When generating versions from a variant the variant items must be joined with the corresponding items of it's base calculation version.
     * Only included variant items will be inserted.
     * (also custom fields should be coppied to the new version)
     * @param {integer} iCalculationVersionId - id of the calculation version
     * @param {integer} iVariantId - id of the variant
     * @returns {integer} - Returns the number of rows inserted.
     *
     */
    this.generateCalculationVersionItems = async (iCalculationVersionId, iVariantId) => {
        const sStmt = `
        insert into "${ Tables.calculation_version_item }"
            (item_id, calculation_version_id, parent_item_id, predecessor_item_id, is_active, highlight_green, highlight_orange, highlight_yellow,
            item_category_id,child_item_category_id, item_description, referenced_calculation_version_id, comment, account_id, determined_account_id, document_type_id, document_id,
            document_version, document_part, document_status_id, design_office_id, material_id, material_type_id, material_group_id,
            is_phantom_material, is_configurable_material, material_source, overhead_group_id, valuation_class_id, purchasing_group,
            purchasing_document,local_content, activity_type_id, process_id, lot_size, lot_size_calculated,
            lot_size_is_manual, engineering_change_number_id,
            company_code_id, cost_center_id, plant_id, work_center_id, work_center_category, efficiency, business_area_id, profit_center_id,
            quantity, quantity_calculated, quantity_is_manual, quantity_uom_id,
            total_quantity, total_quantity_uom_id, total_quantity_depends_on, is_relevant_to_costing_in_erp, base_quantity, base_quantity_calculated,
            base_quantity_is_manual, quantity_per_base_unit, quantity_per_base_unit_uom_id, price_fixed_portion, price_fixed_portion_calculated,
            price_fixed_portion_is_manual, price_variable_portion, price_variable_portion_calculated, price_variable_portion_is_manual, price,
            transaction_currency_id, price_unit, price_unit_calculated, price_unit_is_manual, price_unit_uom_id, is_price_split_active, is_disabling_account_determination,
            price_id, confidence_level_id,
            price_source_id, price_source_type_id, surcharge, is_disabling_price_determination, vendor_id, target_cost,
            target_cost_calculated, target_cost_is_manual, target_cost_currency_id, created_on, created_by, last_modified_on,
            last_modified_by, price_for_total_quantity, price_for_total_quantity_fixed_portion, price_for_total_quantity_variable_portion,
            other_cost, other_cost_fixed_portion, other_cost_variable_portion, total_cost, total_cost_fixed_portion, total_cost_variable_portion,
            total_cost_per_unit, total_cost_per_unit_fixed_portion, total_cost_per_unit_variable_portion, total_quantity_of_variants)
        select 
            item.item_id,
            ? as calculation_version_id,
            item.parent_item_id,
            item.predecessor_item_id,
            item.is_active,
            item.highlight_green,
            item.highlight_orange,
            item.highlight_yellow,
            item.item_category_id,
            item.child_item_category_id,
            item.item_description, 
            item.referenced_calculation_version_id,
            case
                when item.parent_item_id is null            -- get the comment only for the root item
                    then variant.comment
                else item.comment
            end as comment,
            item.account_id,
            item.determined_account_id,
            item.document_type_id,
            item.document_id,
            item.document_version,
            item.document_part,
            item.document_status_id,
            item.design_office_id,
            item.material_id,
            item.material_type_id,
            item.material_group_id,
            item.is_phantom_material,
            item.is_configurable_material,
            item.material_source,
            item.overhead_group_id,
            item.valuation_class_id,
            item.purchasing_group,
            item.purchasing_document,
            item.local_content,
            item.activity_type_id,
            item.process_id,
            item.lot_size,
            item.lot_size_calculated,
            item.lot_size_is_manual,
            item.engineering_change_number_id,
            item.company_code_id,
            item.cost_center_id,
            item.plant_id,
            item.work_center_id,
            item.work_center_category,
            item.efficiency,
            item.business_area_id,
            item.profit_center_id,
            case                                            -- only for the root item quantity
                when variant_item.quantity_state = ${ VariantItemQuantityState.LINKED_VALUE } or item.parent_item_id is null   -- must not be set (only total_quantity allowed)
                    then item.quantity
                else variant_item.quantity
            end as quantity,
            variant_item.quantity_calculated as quantity_calculated,
            case 
                when variant_item.quantity_state = ${ VariantItemQuantityState.LINKED_VALUE } or item.parent_item_id is null
                    then item.quantity_is_manual
                else 
                    variant_item.quantity_state
            end as quantity_is_manual,
            case
                when variant_item.quantity_state = ${ VariantItemQuantityState.LINKED_VALUE } or item.parent_item_id is null
                    then item.quantity_uom_id
                else variant_item.quantity_uom_id 
            end as quantity_uom_id,
            variant_item.total_quantity as total_quantity,
            variant_item.quantity_uom_id as total_quantity_uom_id,
            item.total_quantity_depends_on,
            item.is_relevant_to_costing_in_erp,
            item.base_quantity,
            item.base_quantity_calculated,
            item.base_quantity_is_manual,
            item.quantity_per_base_unit,
            item.quantity_per_base_unit_uom_id,
            item.price_fixed_portion,
            item.price_fixed_portion_calculated,
            item.price_fixed_portion_is_manual,
            item.price_variable_portion,
            item.price_variable_portion_calculated,
            item.price_variable_portion_is_manual,
            item.price,
            item.transaction_currency_id,
            item.price_unit,
            item.price_unit_calculated,
            item.price_unit_is_manual,
            case                                            -- for assembly item take the quantity uom from variant.
                when parents.parent_item_id is not null
                    then variant_item.quantity_uom_id
                else item.price_unit_uom_id
            end as price_unit_uom_id,
            item.is_price_split_active,
            item.is_disabling_account_determination,
            item.price_id,
            item.confidence_level_id,
            item.price_source_id,
            item.price_source_type_id,
            item.surcharge,
            item.is_disabling_price_determination,
            item.vendor_id,
            item.target_cost,
            item.target_cost_calculated,
            item.target_cost_is_manual,
            item.target_cost_currency_id,
            current_utctimestamp as created_on,
            ? as created_by,
            item.last_modified_on,
            item.last_modified_by,
            item.price_for_total_quantity,
            item.price_for_total_quantity_fixed_portion,
            item.price_for_total_quantity_variable_portion,
            item.other_cost,
            item.other_cost_fixed_portion,
            item.other_cost_variable_portion,
            item.total_cost as total_cost,
            item.total_cost_fixed_portion,
            item.total_cost_variable_portion,
            item.total_cost_per_unit,
            item.total_cost_per_unit_fixed_portion,
            item.total_cost_per_unit_variable_portion,
            item.total_quantity_of_variants
        from "${ Tables.variant }" as variant
            inner join "${ Tables.variant_item }" as variant_item
                on variant.variant_id = variant_item.variant_id
            inner join "${ Tables.calculation_version_item }"  as item
                on variant.calculation_version_id = item.calculation_version_id
                and variant_item.item_id = item.item_id
            inner join "${ Tables.calculation_version }" as calculation_version
                on variant.calculation_version_id = calculation_version.calculation_version_id
            inner join "${ Tables.calculation_with_privileges }" as calculation_with_privileges
                on calculation_version.calculation_id = calculation_with_privileges.calculation_id
                    and calculation_with_privileges.user_id = ?
            left outer join (select distinct parent_item_id, calculation_version_id
                            from "${ Tables.calculation_version_item }"
                            where parent_item_id is not null) as parents
                on variant_item.item_id = parents.parent_item_id
                and parents.calculation_version_id = variant.calculation_version_id             -- used to determine if the item is of type assembly
            where variant.variant_id = ?
            and variant_item.is_included = 1
        `;
        const iInsertedRowCount = await dbConnection.executeUpdate(sStmt, iCalculationVersionId, sUserId, sUserId, iVariantId);
        if (iInsertedRowCount === 0) {
            const sClientMsg = 'Error while generating a new calculation version';
            $.trace.error(sClientMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        const aAllCustomFields = metadata.getAllCustomFieldsNamesAsArray();
        if (aAllCustomFields.length > 0) {
            const sInsertStatementItemExt = `insert into "${ Tables.calculation_version_item_ext }" 
                                                (CALCULATION_VERSION_ID, ITEM_ID, ${ aAllCustomFields.join(', ') }) 
                                             select ? as CALCULATION_VERSION_ID, ITEM_ID, ${ aAllCustomFields.join(', ') }
                                                from "${ Tables.calculation_version_item_ext }"
                                                where CALCULATION_VERSION_ID = (select calculation_version_id 
                                                                                from "${ Tables.variant }" 
                                                                                where variant_id = ?) 
                                                and ITEM_ID in (select ITEM_ID 
                                                                from "${ Tables.calculation_version_item }" 
                                                                where calculation_version_id = ?)`;
            await dbConnection.executeUpdate(sInsertStatementItemExt, iCalculationVersionId, iVariantId, iCalculationVersionId);
        }
        return iInsertedRowCount;
    };

    /**
     * Gets all items for a variant that are excluded and their correspondent PREDECESSOR_ITEM_ID from the base version.
     * @param {integer} iCalculationVersionId - the base version id
     * @param {integer} iVariantId - the variant id for which the excluded items must be returned
     *
     * @returns {aReturnObject} -  Returns an array containing all the excluded items (ITEM_ID, PREDECESSOR_ITEM_ID),
     *                             found in the database for the given variant id.
     */
    this.getExcludedVariantItems = async (iCalculationVersionId, iVariantId) => {
        const sStmt = `select version_items.ITEM_ID, version_items.PREDECESSOR_ITEM_ID from "${ Tables.variant_item }" as variant_items 
                        inner join "${ Tables.calculation_version_item }" as version_items
                            on version_items.item_id = variant_items.item_id
                            and version_items.calculation_version_id = ?
                        where variant_items.VARIANT_ID = ?
                        and variant_items.IS_INCLUDED = 0;`;
        const oQueryResult = await dbConnection.executeQuery(sStmt, iCalculationVersionId, iVariantId);
        return Array.from(oQueryResult);
    };

    /**
     * Gets all version items that have as PREDECESSOR_ITEM_ID an item that was excluded before generation from a variant
     * The items that have as a predecessor an item that was excluded cannot be linked with the others when sorting
     * @param {integer} iGeneratedCalculationVersionId - the id of the version that was generated from a variant
     * @param {integer} iVariantId - the variant id from which the version was generated
     *
     * @returns {aReturnObject} -  Returns an array containing incorrect predecessors that have to be replaced
     */
    this.getVersionItemsWrongPredecessor = async (iGeneratedCalculationVersionId, iVariantId) => {
        const sStmt = `select version_items.PREDECESSOR_ITEM_ID from "${ Tables.variant_item }" as variant_items 
                        inner join "${ Tables.calculation_version_item }" as version_items
                            on version_items.predecessor_item_id = variant_items.item_id
                            and version_items.calculation_version_id = ?
                        where variant_items.VARIANT_ID = ?
                        and variant_items.IS_INCLUDED = 0;`;
        const oQueryResult = await dbConnection.executeQuery(sStmt, iGeneratedCalculationVersionId, iVariantId);
        return Array.from(oQueryResult);
    };

    /**
     * Used to correct the PREDECESSOR_ITEM_ID from the t_item table for the case when some items were excluded from a variant before generation
     * @param {integer} iVersionId - the id of the version to which the items that need correction belong
     * @param {Array} aVariantItemsToUpdate - an array containing pairs of CORRECT_PREDECESSOR and PREDECESSOR_TO_CHANGE
     *                                         - PREDECESSOR_TO_CHANGE: represents a PREDECESSOR_ITEM_ID that is not correct and has to be replaced
     *                                         - CORRECT_PREDECESSOR: the replacement of the PREDECESSOR_TO_CHANGE
     */
    this.updateVersionItemsPredecessors = async (iVersionId, aVariantItemsToUpdate) => {
        const sStmt = `
            update "${ Tables.calculation_version_item }" set 
                PREDECESSOR_ITEM_ID = ?
                where PREDECESSOR_ITEM_ID = ? and CALCULATION_VERSION_ID = ?
        `;
        const aValues = aVariantItemsToUpdate.map(oItemValues => {
            const aItemValues = [];
            aItemValues.push(oItemValues.CORRECT_PREDECESSOR);
            aItemValues.push(oItemValues.PREDECESSOR_TO_CHANGE);
            aItemValues.push(iVersionId);
            return aItemValues;
        });
        return await dbConnection.executeUpdate(sStmt, aValues);
    };


    /**
     * 
     * Used to correct IS_INCLUDED in case an item inside @aListOfItemsToUpdate is not considered in the calculation of the variant matrix.
     * 
     * @param {number} iVariantId - the id of the variant to which the items that need correction belong
     * @param {array} aListOfItemsToUpdate - list of item to be corrected.
     */

    this.updateParentsIsIncludedState = async function (iVariantId, aListOfItemsToUpdate) {
        await dbConnection.executeUpdate(`UPDATE "${ Tables.variant_item }" set IS_INCLUDED = 1
            WHERE VARIANT_ID = ? AND IS_INCLUDED = 0 AND
            ITEM_ID in (${ aListOfItemsToUpdate.join(',') })`, iVariantId);
    };

    /**
     * Checks if a sum variant already exists for a given calculation version
     * A maximum of 1 sum variant is allowed for each calculation version
     * @param {integer} iVersionId - id of the calculation version
     * @return {boolean} true if sum variant exists for given calc version, false otherwise
     */
    this.checkSumVariantExists = async iVersionId => {
        const aQueryResult = await dbConnection.executeQuery(` select VARIANT_ID from "${ Tables.variant }" where CALCULATION_VERSION_ID = '${ iVersionId }' and VARIANT_TYPE = 1`);
        return aQueryResult.length !== 0;
    };

    /**
     * 
     * @param {integer} iVariantId - id of variant
     */
    this.addQuantityUomToItems = async iVariantId => {
        const sStmt = `update variantItem set QUANTITY_UOM_ID = variantItemTemporary.QUANTITY_UOM_ID
            from "${ Tables.variant_item }" variantItem inner join "${ Tables.variant_item_temporary }" variantItemTemporary on variantItem.ITEM_ID = variantItemTemporary.ITEM_ID and
            variantItem.VARIANT_ID = variantItemTemporary.VARIANT_ID and variantItem.VARIANT_ID = ${ iVariantId }`;
        await dbConnection.executeUpdate(sStmt);
    };
}
Variant.prototype = Object.create(Variant.prototype);
Variant.prototype.constructor = Variant;

module.exports.Tables = Tables;
module.exports.Sequences = Sequences;
module.exports.Procedures = Procedures;
module.exports.Variant = Variant;
export default {Helper,helpers,_,MessageLibrary,PlcException,Code,Constants,CalculationVersionType,VariantMatrixLockContext,VariantItemQuantityState,Metadata,Tables,Sequences,Procedures,Variant};
