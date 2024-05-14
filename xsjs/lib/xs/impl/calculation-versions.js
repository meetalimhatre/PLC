const _ = require('lodash');
const helpers = require('../util/helpers');
const constants = require('../util/constants');
const MetaInformation = constants.ServiceMetaInformation;
const ServiceParameters = constants.ServiceParameters;
const CalculationVersionService = require('../service/calculationVersionService');
const calculationVersionSearchDefaultValues = constants.calculationVersionSearchDefaultValues;
const sDefaultExchangeRateType = constants.sDefaultExchangeRateType;
const oPriceDeterminationScenarios = constants.PriceDeterminationScenarios;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;

const Items = require('./items').Items;
const CalculationVersionSaveHandler = require('../service/calculationVersionSaveHandler').CalculationVersionSaveHandler;


module.exports.CalculationVersions = function ($) {

    const that = this;
    var sUserId;
    const sSessionId = sUserId = $.getPlcUsername();
    const items = new Items($);

    //REMARK (RF): this is a temporary solution for 1.0; we should think about a better solution to determine the
    //properties that are protected in a specific contexts; root cause for this that for save and update different objects
    //send from the client; maybe also a different implementation of update in the persistency layer can help
    var aProtectedColumnsUpdate = [
        'SESSION_ID',
        'CALCULATION_VERSION_ID',
        'CALCULATION_VERSION_TYPE',
        'CALCULATION_ID',
        'MASTER_DATA_TIMESTAMP',
        'LAST_MODIFIED_ON',
        'LAST_MODIFIED_BY'
    ];

    /**
 * Handles a HTTP GET request.
 * Gets Calculation Versions: 
 * - it will return all calculations versions from a calculation when parameter calculation_id is used or top "n" calculations when used together with parameter top
 * - it will return recently used calculation versions when parameter recently_used is "true" or top "n" calculations when used together with parameter top
 * - it will always return root item for each calculation version
 * - it will always return masterdata 
 * - it will return project and calculation only when parameter recently_used is "true".
 */
    this.get = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {

        var iId = await helpers.isNullOrUndefined(mParameters.id || mParameters.calculation_version_id) ? null : mParameters.id || mParameters.calculation_version_id;

        if (iId !== null && !oPersistency.CalculationVersion.exists(iId) && mParameters.search !== true) {
            const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iId });
            const sClientMsg = 'Calculation version no longer exists.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iId }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
        }

        let sCalculationId = '';

        if (mParameters.project_id) {
            const projects = mParameters.project_id.split(',');
            oPersistency.Project.checkProjectsExist(projects, sUserId);
            const iTop = await helpers.isNullOrUndefined(mParameters.top) ? 100000 : mParameters.top;
            const aCalculations = oPersistency.Calculation.getSaved(projects, sUserId, null, iTop, null, iTop);

            sCalculationId = aCalculations.calculations.map(value => value.CALCULATION_ID).join();
        } else {
            sCalculationId = await helpers.isNullOrUndefined(mParameters.calculation_id) ? null : mParameters.calculation_id;
        }

        var iCurrent = await helpers.isNullOrUndefined(mParameters.current) ? 0 : mParameters.loadMasterdata === false ? 0 : 1;

        if (mParameters.search === true) {
            await getFilteredVersions(mParameters, iId);
        } else {
            if (sCalculationId !== null && iCurrent === 0 && !oPersistency.Calculation.exists(parseInt(sCalculationId, 10))) {
                let oMessageDetails = new MessageDetails().addCalculationObjs({ id: parseInt(sCalculationId, 10) });

                const sClientMsg = 'Calculation no longer exists.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ sCalculationId }`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
            }
            if (sCalculationId === null || iId === null || iCurrent === 1) {
                await getCalculationVersions(mParameters, iId, sCalculationId, iCurrent);
            }
        }

        return oServiceOutput;

        /**
	 * Function for getting the calculation versions that match the search criteria.
	 * @param {string}
	 *            mParameters - parameters from the URL of the HTTP GET request (top, filter, sortingColumn, sortingDirection)
	 * @param {string}
	 *            iId - the id of the calculation version that should be retrieved.
	 */
        async function getFilteredVersions(mParameters, iId) {

            var iTop = await helpers.isNullOrUndefined(mParameters.top) ? calculationVersionSearchDefaultValues.MaxQueryResults : mParameters.top;
            var sFilters = await helpers.isNullOrUndefined(mParameters.filter) ? null : mParameters.filter;
            var sSortingColumn = await helpers.isNullOrUndefined(mParameters.sortingColumn) ? calculationVersionSearchDefaultValues.SortingColumn : mParameters.sortingColumn;
            var sSortingDirection = await helpers.isNullOrUndefined(mParameters.sortingDirection) ? calculationVersionSearchDefaultValues.SortingDirection : mParameters.sortingDirection;
            var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
            var aGetCalculationsVersionsSearchOutput = oPersistency.CalculationVersion.getCalculationVersionsToBeReferenced(iId, sFilters, sSortingColumn, sSortingDirection, iTop, mSessionDetails.language, sUserId);

            oServiceOutput.setTransactionalData(aGetCalculationsVersionsSearchOutput);
        }

        /**
	 * Function for getting:
	 *          - the calculation that has the id iId or
	 *          - the recent calculation versions or
	 *          - the current calculation versions for a list of calculation ids. 
	 */
        async function getCalculationVersions(mParameters, iId, sCalculationId, iCurrent) {

            var aCalculationVersions = [];
            var iTop = await helpers.isNullOrUndefined(mParameters.top) ? null : mParameters.top;
            var iRecentlyUsed = await helpers.isNullOrUndefined(mParameters.recently_used) ? 0 : mParameters.recently_used === false ? 0 : 1;
            var iLoadMasterdata = await helpers.isNullOrUndefined(mParameters.loadMasterdata) ? 0 : mParameters.loadMasterdata === false ? 0 : 1;
            const bOmitItems = mParameters.omitItems || false;
            const bReturnLifecycle = await helpers.isNullOrUndefined(mParameters.returnLifecycle) ? 1 : mParameters.returnLifecycle === false ? 0 : 1;
            const bGetOnlyLifecycles = await helpers.isNullOrUndefined(mParameters.calculation_version_id) ? 0 : 1;

            var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
            var oGetCalculationsOutput = oPersistency.CalculationVersion.get(sCalculationId, iTop, iRecentlyUsed, iId, iLoadMasterdata, sUserId, mSessionDetails.language, iCurrent, bReturnLifecycle, bGetOnlyLifecycles, 1);
            _.each(oGetCalculationsOutput.CALCULATION_VERSIONS, function (oCurrentCalculationVersion) {
                var oCalculationVersions = {};
                oCalculationVersions = _.clone(oCurrentCalculationVersion);
                if (oCalculationVersions.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle || oCalculationVersions.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion) {
                    delete oCalculationVersions.HAS_LIFECYCLES;
                }
                if (bOmitItems === false) {
                    oCalculationVersions.ITEMS = _.filter(oGetCalculationsOutput.ITEMS, oItem => oItem.CALCULATION_VERSION_ID === oCurrentCalculationVersion.CALCULATION_VERSION_ID);
                } else {
                    oCalculationVersions.ITEMS = [];
                }
                aCalculationVersions.push(oCalculationVersions);
            });

            var aTransactionalData = {
                'CALCULATION_VERSIONS': aCalculationVersions,
                'CALCULATIONS': oGetCalculationsOutput.CALCULATIONS,
                'PROJECTS': oGetCalculationsOutput.PROJECTS
            };
            oServiceOutput.setTransactionalData(aTransactionalData);
            oServiceOutput.addMasterdata(oGetCalculationsOutput.MASTERDATA);
        }
    };


    /**
 * Gets a single persisted calculation version and writes the results to the service output object. The function is currently used for requests
 * towards /calculation-versions/{calculation-version-id} resource. It uses the parameters calculation_version_id, loadMasterdata and expand. 
 * In case loadMasterdata=false, the masterdata of the transactional data is not part of the response. calculation_version_id and expand are 
 * mandatory parameters.
 * 
 * NOTE:    The function is uses the procedure p_calculations_versions_read (via oPersistency.CalculationVersion.get), which is not an optimal solution.
 *          The procedure always loads masterdata, even when URL parameter loadMasterdata=false. So, here is room for improvement, however it was 
 *          decided, to do the optimization only if we notice bad performance (huge refactoring effort.)
 * 
 * @param {object} oBodyData Data contained in the body of the request. Supposed to be empty for this function.
 * @param {map} mParameters Key-Value pairs for parameters of the request.
 * @param {object} oServiceOutput Object the result of the function is written to. 
 * @param {object} oPersistency Instance of persistency object to access database tables.
 */
    this.getSingle = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        const iCvId = mParameters.calculation_version_id;
        if (!oPersistency.CalculationVersion.exists(iCvId)) {
            const sClientMsg = 'Calculation version does not exist.';
            const sServerMsg = `${ sClientMsg }. Id of the calculation version: ${ iCvId }`;
            $.trace.info(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        const iTop = 1, iRecentlyUsed = 0, iCurrent = 0, bReturnLifecycle = 1, bGetOnlyLifecycles = 0;
        const mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        // masterdata shall not be returned by this service call; if clients need masterdata, they need to query another service resource deliver masterdata
        // for the version
        const iLoadMasterdata = 0;
        const oProcedureResult = oPersistency.CalculationVersion.get(null, iTop, iRecentlyUsed, iCvId, iLoadMasterdata, sUserId, mSessionDetails.language, iCurrent, bReturnLifecycle, bGetOnlyLifecycles, 0);

        if (oProcedureResult.CALCULATION_VERSIONS.length < 1) {
            const sClientMsg = 'Calculation version does not longer exist. It might have been deleted.';
            const sServerMsg = `${ sClientMsg }. Id of the calculation version: ${ iCvId }`;
            $.trace.info(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        // the object returned from the result set are immutable; for this reason _.clone is used to create a mutable copy
        const oCalculationVersion = _.clone(oProcedureResult.CALCULATION_VERSIONS[0]);
        if (mParameters.expand === 'ITEMS') {
            oCalculationVersion.ITEMS = oProcedureResult.ITEMS;
        }
        // if there are no referenced versions, do not write the referencesdata in the response
        if (!helpers.isNullOrUndefined(oProcedureResult.referencesdata)) {
            oServiceOutput.setReferencesData(oProcedureResult.referencesdata);
        }
        oServiceOutput.setTransactionalData(oCalculationVersion);
    };

    /**
 * Handles a HTTP GET request for recover service.
 * Recover Calculation Versions: 
 * 		-  will return top "n" calculations versions that were opened in a previous session and needs to be recovered
 * 		-  will always return root item for each calculation version
 * 		-  will return projects and calculations that are assigned to calculation versions found.
 */
    this.recover = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        // Remove all locks for variant matrix context which may remain from previous wrong finished sessions.
        oPersistency.CalculationVersion.unlockVariantMatrixVersionsForSession(sSessionId);

        var aCalculationVersions = [];
        const iTop = await helpers.isNullOrUndefined(mParameters.top) ? constants.maxQueryResults : mParameters.top;

        const oRecoverCalculationsOutput = oPersistency.CalculationVersion.recover(iTop, sUserId);
        _.each(oRecoverCalculationsOutput.CALCULATION_VERSIONS, function (oCurrentCalculationVersion) {
            var oCalculationVersions = {};
            oCalculationVersions = _.clone(oCurrentCalculationVersion);
            oCalculationVersions.ITEMS = _.filter(oRecoverCalculationsOutput.ITEMS, function (oItem) {
                return oItem.CALCULATION_VERSION_ID === oCurrentCalculationVersion.CALCULATION_VERSION_ID;
            });
            aCalculationVersions.push(oCalculationVersions);
        });

        const aTransactionalData = {
            'CALCULATION_VERSIONS': aCalculationVersions,
            'CALCULATIONS': oRecoverCalculationsOutput.CALCULATIONS,
            'PROJECTS': oRecoverCalculationsOutput.PROJECTS
        };
        oServiceOutput.setTransactionalData(aTransactionalData);

        return oServiceOutput;
    };

    /**
 * Reads calculation version data for provided CV id and fills output object accordingly.
 */
    this.openCalculationVersion = async function (oBodyData, mParameters, oServiceOutput, oPersistency, iCalcVersionId, bCopyData) {

        var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
        var bCompressedResult = mParameters.compressedResult ? mParameters.compressedResult : false;
        const bOmitItems = mParameters.omitItems || false;

        oPersistency.CalculationVersion.checkLockCalculatingLifecycle(iCalcVersionId);

        var oReadCalculationVersionResult = await oPersistency.CalculationVersion.open(iCalcVersionId, sSessionId, sUserId, mSessionDetails.language, bCopyData, bCompressedResult);
        if (_.isEmpty(oReadCalculationVersionResult.version)) {
            const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalcVersionId });

            const sClientMsg = 'Calculation version not found.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        var aResultItems;
        var oRootItem = {};
        if (bCompressedResult) {
            aResultItems = oReadCalculationVersionResult.itemsCompressed;
            // Get the root item since IS_DIRTY is not stored in t_open_calculation_version anymore.
            if (aResultItems.hasOwnProperty('PARENT_ITEM_ID')) {
                var iRootItemIndex = aResultItems.PARENT_ITEM_ID.findIndex(el => el === null);
                oRootItem.TOTAL_COST = aResultItems.hasOwnProperty('TOTAL_COST') ? aResultItems.TOTAL_COST[iRootItemIndex] : null;
                oRootItem.TOTAL_QUANTITY = aResultItems.hasOwnProperty('TOTAL_QUANTITY') ? aResultItems.TOTAL_QUANTITY[iRootItemIndex] : null;
                oRootItem.TOTAL_QUANTITY_UOM_ID = aResultItems.hasOwnProperty('TOTAL_QUANTITY_UOM_ID') ? aResultItems.TOTAL_QUANTITY_UOM_ID[iRootItemIndex] : null;
                oRootItem.IS_DIRTY = aResultItems.hasOwnProperty('IS_DIRTY') ? _.includes(aResultItems.IS_DIRTY, 1) ? 1 : 0 : null;
            }
        } else {
            aResultItems = oReadCalculationVersionResult.items;
            // Get the root item since IS_DIRTY is not stored in t_open_calculation_version anymore.
            oRootItem = _.find(aResultItems, async function (oRootItemCandidate) {
                return await helpers.isNullOrUndefined(oRootItemCandidate.PARENT_ITEM_ID);
            });
        }

        // Add TOTAL_COST, TOTAL_QUANTITY and TOTAL_QUANTITY_UOM_ID to the version level (required only in Backend API).
        oReadCalculationVersionResult.version.TOTAL_COST = oRootItem.TOTAL_COST;
        oReadCalculationVersionResult.version.TOTAL_QUANTITY = oRootItem.TOTAL_QUANTITY;
        oReadCalculationVersionResult.version.TOTAL_QUANTITY_UOM_ID = oRootItem.TOTAL_QUANTITY_UOM_ID;
        if (oReadCalculationVersionResult.version.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.Lifecycle || oReadCalculationVersionResult.version.CALCULATION_VERSION_TYPE === constants.CalculationVersionType.ManualLifecycleVersion) {
            oReadCalculationVersionResult.version.LIFECYCLE_PERIOD_DESCRIPTION = oPersistency.CalculationVersion.getLifecyclePeriodDescription(iCalcVersionId);
        }

        //This is for the update function. When updateMasterdataTimestamp && omitItems are both true (required only in Backend API).
        if (bOmitItems === true) {
            oReadCalculationVersionResult.items = [];
        }

        if (mParameters.loadMasterdata === true) {
            var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(iCalcVersionId, mSessionDetails.language, sSessionId);
            oServiceOutput.addMasterdata(mCalculationMasterdata);
        }

        var oOutputObject = await CalculationVersionService.prepareOutput(oReadCalculationVersionResult);

        var iIsWritable = await handleVersionLock(oServiceOutput, oPersistency, iCalcVersionId);

        oOutputObject[MetaInformation.IsDirty] = oRootItem.IS_DIRTY;
        oOutputObject[MetaInformation.IsWritable] = iIsWritable;

        oServiceOutput.setTransactionalData(oOutputObject);
        oServiceOutput.setReferencesData(oReadCalculationVersionResult.referencesdata);

        return oServiceOutput;
    };
    /**
 * Function that retuns the update scenarion needed for price determination based on the updated columns
 */
    function determineUpdateScenario(mTriggerColumnsChanged) {
        let sUpdateScenario = oPriceDeterminationScenarios.AllCategoriesScenario;
        if (mTriggerColumnsChanged.size === 1 && mTriggerColumnsChanged.get('MATERIAL_PRICE_STRATEGY_ID'))
            sUpdateScenario = oPriceDeterminationScenarios.MaterialPriceDeterminationScenario;
        else if (mTriggerColumnsChanged.size === 1 && mTriggerColumnsChanged.get('ACTIVITY_PRICE_STRATEGY_ID'))
            sUpdateScenario = oPriceDeterminationScenarios.ActivityPriceDeterminationScenario;

        return sUpdateScenario;
    }
    ;

    /**
 * Handles a HTTP PUT requests. The implementation updates the database entry in t_calculation_version_temporary based on JSON data the
 * client gives in the request body. This update uses a opt-in approach, which means only properties that are contained in the request are
 * updated. Properties that shall be set to <code>NULL</code> must be explicitly set to to <code>null</code> in the request data.
 */
    this.update = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        var oMessageDetails = new MessageDetails();
        const bOmitItems = aParameters.omitItems || false;
        // NOTE: opening multiple calculation versions is currently not supported; should we update the code accordingly?

        var aOldCalculationVersions = oPersistency.CalculationVersion.getWithoutItems(_.map(oBodyData, function (version) {
            return version.CALCULATION_VERSION_ID;
        }), sSessionId);

        var mOldCalculationVersions = {};
        _.each(aOldCalculationVersions, function (oVersion) {
            mOldCalculationVersions[oVersion.CALCULATION_VERSION_ID] = oVersion;
        });

        // Check if all CalculationVersionIds have been found in the database.
        if (_.some(oBodyData, function (oVersion) {
                return mOldCalculationVersions[oVersion.CALCULATION_VERSION_ID] === undefined;
            })) {
            const sLogMessage = 'One or more calculation versions do not exist.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        // Process each calculation version sent in the body.
        _.each(oBodyData, async function (oCalculationVersion) {

            var iIsDirty = 0;
            var iCalculationVersionId = await helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);
            oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

            if (!helpers.isNullOrUndefined(oCalculationVersion.STATUS_ID)) {
                let oStatus = oPersistency.CalculationVersion.getStatusById(oCalculationVersion.STATUS_ID);
                if (helpers.isNullOrUndefined(oStatus)) {
                    const sClientMsg = `Calculation version status not found. Status id: ${ oCalculationVersion.STATUS_ID }.`;
                    $.trace.error(sClientMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                }

                if (oStatus.IS_ACTIVE === 0) {
                    const sClientMsg = `Calculation version status is deactivated. Status id: ${ oCalculationVersion.STATUS_ID }.`;
                    $.trace.error(sClientMsg);
                    throw new PlcException(Code.STATUS_NOT_ACTIVE_ERROR, sClientMsg);
                }
            }

            if (aParameters.updateMasterdataTimestamp === true) {
                // Update timestamp.
                var dTimestamp = new Date();
                oPersistency.CalculationVersion.updateMasterdataTimestamp(iCalculationVersionId, sSessionId, dTimestamp);

                iIsDirty = 1;
                oPersistency.CalculationVersion.setDirty(iCalculationVersionId, sSessionId, sUserId, iIsDirty);

                var oUpdatedCalculationVersion = {};
                oUpdatedCalculationVersion[MetaInformation.CalculationVersionId] = iCalculationVersionId;
                oUpdatedCalculationVersion[MetaInformation.IsDirty] = iIsDirty;
                oServiceOutput.setTransactionalData(oUpdatedCalculationVersion);

                that.openCalculationVersion(oBodyData, aParameters, oServiceOutput, oPersistency, iCalculationVersionId, false);

                return;
            }

            var oOldCalculationVersion = mOldCalculationVersions[iCalculationVersionId];
            if (_.some(_.keys(oOldCalculationVersion), function (key) {
                    return oOldCalculationVersion[key] !== oCalculationVersion[key];
                })) {
                // Check if calculation version name is unique.
                await CalculationVersionService.isNameUnique(oPersistency, oCalculationVersion.CALCULATION_ID, oCalculationVersion.CALCULATION_VERSION_ID, oCalculationVersion.CALCULATION_VERSION_NAME, oMessageDetails);

                const iCalculationVersionType = oPersistency.CalculationVersion.getVersionType(oCalculationVersion.CALCULATION_VERSION_ID, sSessionId);
                if (iCalculationVersionType === constants.CalculationVersionType.Lifecycle || iCalculationVersionType === constants.CalculationVersionType.ManualLifecycleVersion) {
                    aProtectedColumnsUpdate.push('LIFECYCLE_PERIOD_FROM', 'BASE_VERSION_ID');
                }
                ;
                var iAffectedRows = await oPersistency.CalculationVersion.update(oCalculationVersion, aProtectedColumnsUpdate, sSessionId);

                if (iAffectedRows === 0) {
                    const sClientMsg = "Calculation version wasn't updated and/or does not exist.";
                    const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                }


                if (helpers.isNullOrUndefined(oCalculationVersion.CUSTOMER_ID)) {
                    oCalculationVersion.CUSTOMER_ID = null;
                }

                const aPriceDeterminationTriggerColumns = [
                    'CUSTOMER_ID',
                    'MATERIAL_PRICE_STRATEGY_ID',
                    'ACTIVITY_PRICE_STRATEGY_ID'
                ];
                const mTriggerColumnsChanged = new Map();
                aPriceDeterminationTriggerColumns.forEach(sColumnName => {
                    if (oCalculationVersion[sColumnName] && oCalculationVersion[sColumnName] !== oOldCalculationVersion[sColumnName])
                        mTriggerColumnsChanged.set(sColumnName, oCalculationVersion[sColumnName]);
                });

                if (oCalculationVersion['VALUATION_DATE'].getTime() !== oOldCalculationVersion['VALUATION_DATE'].getTime())
                    mTriggerColumnsChanged.set('VALUATION_DATE', oCalculationVersion['VALUATION_DATE']);


                var oOutputCalculationVersion;
                if (mTriggerColumnsChanged.size > 0) {
                    oPersistency.CalculationVersion.persistUpdatedColumns(iCalculationVersionId, sSessionId, mTriggerColumnsChanged);
                    const sUpdateScenario = await determineUpdateScenario(mTriggerColumnsChanged);

                    var oPriceDeterminationResult = oPersistency.CalculationVersion.triggerPriceDetermination(iCalculationVersionId, sSessionId, sUpdateScenario);


                    var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);

                    var oCalculationVersionResult = await oPersistency.CalculationVersion.open(iCalculationVersionId, sSessionId, sUserId, mSessionDetails.language, false);


                    var oCalculationVersionWithUpdatedItemPriceInfo = oCalculationVersion;
                    if (bOmitItems === false) {
                        if (aParameters.compressedResult) {
                            oCalculationVersionWithUpdatedItemPriceInfo.ITEMS_COMPRESSED = await helpers.transposeResultArrayOfObjects(oPriceDeterminationResult.UPDATED_ITEMS);
                        } else {
                            oCalculationVersionWithUpdatedItemPriceInfo.ITEMS = oPriceDeterminationResult.UPDATED_ITEMS;
                        }
                    } else {
                        oCalculationVersionWithUpdatedItemPriceInfo.ITEMS = [];
                    }

                    oOutputCalculationVersion = oCalculationVersionWithUpdatedItemPriceInfo;
                } else {

                    oOutputCalculationVersion = {};
                    oOutputCalculationVersion[MetaInformation.CalculationVersionId] = iCalculationVersionId;
                }


                let sSelectedCostingSheet = oCalculationVersion.COSTING_SHEET_ID;
                let sOldSelectedCostingSheet = oOldCalculationVersion.COSTING_SHEET_ID;
                if (helpers.isNullOrUndefined(sSelectedCostingSheet) || sSelectedCostingSheet !== sOldSelectedCostingSheet) {
                    oOutputCalculationVersion.SELECTED_TOTAL_COSTING_SHEET = constants.CalculationVersionCostingSheetTotals[0];
                }


                let sSelectedCompSplit = oCalculationVersion.COMPONENT_SPLIT_ID;
                let sOldSelectedCompSplit = oOldCalculationVersion.COMPONENT_SPLIT_ID;
                if (helpers.isNullOrUndefined(sSelectedCompSplit) || sSelectedCompSplit !== sOldSelectedCompSplit) {
                    oOutputCalculationVersion.SELECTED_TOTAL_COMPONENT_SPLIT = constants.CalculationVersionCostingSheetTotals[0];
                }


                if (oOldCalculationVersion.REPORT_CURRENCY_ID !== oCalculationVersion.REPORT_CURRENCY_ID) {
                    oPersistency.Item.setPriceTransactionCurrencyForAssemblyItems(sSessionId, iCalculationVersionId, oCalculationVersion.REPORT_CURRENCY_ID);
                }

                if (aParameters.loadMasterdata === true) {
                    var aBusinessObjectsEntities = [
                        'PRICE_COMPONENT_ENTITIES',
                        'ACCOUNT_ENTITIES'
                    ];
                    var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
                    var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(iCalculationVersionId, mSessionDetails.language, sSessionId, aBusinessObjectsEntities);
                    oServiceOutput.addMasterdata(mCalculationMasterdata);
                }


                iIsDirty = 1;
                oPersistency.CalculationVersion.setDirty(iCalculationVersionId, sSessionId, sUserId, iIsDirty);


                oOutputCalculationVersion[MetaInformation.IsDirty] = iIsDirty;

                if (helpers.isNullOrUndefined(oOutputCalculationVersion.ITEMS) === true) {

                    oOutputCalculationVersion.ITEMS = [];
                }

                oServiceOutput.addTransactionalData(oOutputCalculationVersion);

            }
        });
    };




    this.handlePostRequest = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        const bOmitItems = aParameters.omitItems || false;
        var sActionParameter = aParameters.action;
        switch (sActionParameter) {
        case ServiceParameters.Open:
            await open();
            break;
        case ServiceParameters.Close:
            await close();
            break;
        case ServiceParameters.Create:
            await create();
            break;
        case ServiceParameters.Copy:
            await copy();
            break;
        case ServiceParameters.Freeze:
            await freeze();
            break;
        case ServiceParameters.Save:
            await save();
            break;
        case ServiceParameters.SaveAs:
            await saveAs();
            break;
        default: {
                const sLogMessage = `Unknown value ${ sActionParameter } of action parameter for POST calculation-version`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        function open() {
            var iCalcVersionId = parseInt(aParameters.id, 10);

            that.openCalculationVersion(oBodyData, aParameters, oServiceOutput, oPersistency, iCalcVersionId, true);
        }

        async function close() {
            _.each(oBodyData, async oCalculationVersion => {
                var iCalculationVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
                try {
                    await oPersistency.CalculationVersion.close(iCalculationVersionId, sSessionId);
                } catch (e) {


                    $.trace.warning(`An error occured when closing ${ iCalculationVersionId }`);
                }
            });
        }





        async function create() {
            var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());

            _.each(oBodyData, async oCalculationVersion => {
                var iCalculationId = oCalculationVersion.CALCULATION_ID;
                var iCalculationVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
                var oMessageDetails = new MessageDetails();
                oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });


                await CalculationVersionService.checkIfCalculationExists(oPersistency, iCalculationId);

                if (!oPersistency.CalculationVersion.checkSavedVersion(iCalculationId)) {
                    const sClientMsg = 'First calculation version of calculation not saved.';
                    const sServerMsg = `${ sClientMsg } Calculation Id: ${ iCalculationId }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.FIRST_CALCULATIONVERSION_NOT_SAVED, sClientMsg);
                }

                async function setDefaultValues(oCalculationVersion, sUserId) {

                    var oCalculation = oPersistency.Calculation.getCurrentCalculationData(oCalculationVersion.CALCULATION_ID);

                    var oDefaultSettings = oPersistency.Project.getProjectProperties(oCalculation.PROJECT_ID);
                    if (helpers.isNullOrUndefined(oDefaultSettings)) {
                        const sClientMsg = 'Default settings for calculation not found in project.';
                        const sServerMsg = `${ sClientMsg } Calculation id: ${ oCalculationVersion.CALCULATION_ID }, project id: ${ oCalculation.PROJECT_ID }.`;
                        $.trace.error(sServerMsg);
                        throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
                    } else {
                        if (helpers.isNullOrUndefined(oCalculationVersion.CALCULATION_VERSION_NAME)) {
                            oCalculationVersion.CALCULATION_VERSION_NAME = 'Version 1';
                        }

                        await helpers.setDefaultValuesForCalculationVersion(oCalculationVersion, oDefaultSettings);
                        if (helpers.isNullOrUndefined(oCalculationVersion.EXCHANGE_RATE_TYPE_ID)) {

                            oCalculationVersion.EXCHANGE_RATE_TYPE_ID = sDefaultExchangeRateType;
                        }
                    }
                }

                var aResponseContent = [];

                _.each([oCalculationVersion], async function (oCvToCreate) {

                    await setDefaultValues(oCvToCreate, sUserId);

                    items.setDefaultValueForIsManualField([oCvToCreate.ITEMS[0]], oPersistency);

                    var oResult = await oPersistency.CalculationVersion.create(oCvToCreate, sSessionId, sUserId);
                    if (_.isNull(oResult)) {
                        oServiceOutput.setStatus($.net.http.CONFLICT);
                    } else {

                        var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCvToCreate.CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);
                        oServiceOutput.addMasterdata(mCalculationMasterdata);

                        oResult[MetaInformation.IsDirty] = oResult.ITEMS[0].IS_DIRTY;


                        aResponseContent.push(oResult);

                    }
                });

                if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
                    oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
                }
            });
        }






        async function copy() {
            var iCalculationVersionId = parseInt(aParameters.id, 10);
            var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());

            var oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });

            await CalculationVersionService.checkIfVersionExists(oPersistency, sSessionId, iCalculationVersionId, oMessageDetails);

            const bCompressedResult = aParameters.compressedResult ? aParameters.compressedResult : false;
            const oCopy = await oPersistency.CalculationVersion.copy(iCalculationVersionId, sSessionId, sUserId, mSessionDetails.language, bCompressedResult);
            var oCalculationVersion = oCopy.calculation_version;
            if (bOmitItems === false) {
                if (bCompressedResult) {
                    oCalculationVersion.ITEMS_COMPRESSED = oCopy.itemsCompressed;
                } else {
                    oCalculationVersion.ITEMS = oCopy.items;
                }
            } else {
                oCalculationVersion.ITEMS = [];
            }

            var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCalculationVersion.CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);
            oServiceOutput.addMasterdata(mCalculationMasterdata);
            oServiceOutput.setReferencesData(oCopy.referencesdata);

            if (bCompressedResult) {
                oCalculationVersion[MetaInformation.IsDirty] = oCopy.itemsCompressed.IS_DIRTY[0];
            } else {
                oCalculationVersion[MetaInformation.IsDirty] = oCopy.items[0].IS_DIRTY;
            }

            var aResponseContent = [];
            aResponseContent.push(oCalculationVersion);
            if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
                oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
            }
        }






        async function freeze() {
            var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());
            _.each(oBodyData, async oCalculationVersion => {
                var iCalcVersionId = oCalculationVersion.CALCULATION_VERSION_ID;
                var oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalcVersionId });


                await CalculationVersionService.isOpenedAndLockedInSession(oPersistency, sSessionId, iCalcVersionId, oMessageDetails);

                if (oPersistency.CalculationVersion.isDirty(iCalcVersionId, sSessionId, sUserId)) {
                    const sClientMsg = 'Cannot freeze calculation version because it contains unsaved changes.';
                    const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(Code.CALCULATIONVERSION_NOT_SAVED_ERROR, sClientMsg, oMessageDetails);
                }

                if (oPersistency.CalculationVersion.isFrozen(iCalcVersionId)) {
                    const sLogMessage = `Cannot freeze calculation version ${ iCalcVersionId } because it is already frozen`;
                    $.trace.info(sLogMessage);
                    let message = new Message(Code.CALCULATIONVERSION_ALREADY_FROZEN_INFO, Severity.INFO, oMessageDetails);
                    oServiceOutput.addMessage(message);
                    return oServiceOutput;
                }


                await CalculationVersionService.checkIsLifecycleVersion(oPersistency, sSessionId, iCalcVersionId, true);


                let aLifecycleVersionsIds = oPersistency.CalculationVersion.getLifecycleVersionsIds(iCalcVersionId);

                oPersistency.CalculationVersion.setFrozenFlags(iCalcVersionId, sSessionId, aLifecycleVersionsIds);

                var message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oMessageDetails);
                oServiceOutput.addMessage(message);

                var oReadCalculationVersionResult = await oPersistency.CalculationVersion.open(iCalcVersionId, sSessionId, sUserId, mSessionDetails.language, true);
                var oOutputObject = await CalculationVersionService.prepareOutput(oReadCalculationVersionResult, bOmitItems);

                oServiceOutput.setTransactionalData(oOutputObject);
            });
        }

        async function save() {
            _.each(oBodyData, async oCalculationVersion => {
                var oHandler = await new CalculationVersionSaveHandler($, oCalculationVersion, CalculationVersionService, oPersistency, oServiceOutput, bOmitItems);
                await oHandler.checkSave().prepareSave().execute();
            });
        }

        async function saveAs() {
            _.each(oBodyData, async oCalculationVersion => {
                var oHandler = await new CalculationVersionSaveHandler($, oCalculationVersion, CalculationVersionService, oPersistency, oServiceOutput, bOmitItems);
                await oHandler.checkSaveAs().prepareSaveAs().execute();
            });
        }
    };











    this.remove = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        var oMessageDetails = new MessageDetails();


        _.each(oBodyData, async function (oCalculationVersion) {
            var iCalculationVersionId = await helpers.toPositiveInteger(oCalculationVersion.CALCULATION_VERSION_ID);


            await CalculationVersionService.checkIfVersionExists(oPersistency, sSessionId, iCalculationVersionId, oMessageDetails);



            var aDbOpeningUsers = oPersistency.CalculationVersion.getOpeningUsers(iCalculationVersionId);
            if (aDbOpeningUsers.length > 0) {
                let aOpeningUserDetails = _.map(aDbOpeningUsers, function (oDbOpeneningUser) {
                    return { id: oDbOpeneningUser.USER_ID };
                });
                let oCvStillOpenDetails = new MessageDetails().addCalculationVersionObjs({
                    id: iCalculationVersionId,
                    openingUsers: aOpeningUserDetails
                });
                const sClientMsg = 'Calculation version cannot be deleted. Still opened by other user(s).';
                const sServerMsg = `${ sClientMsg } Calculation version id: '${ iCalculationVersionId }', user(s): ${ JSON.stringify(oCvStillOpenDetails) }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oCvStillOpenDetails);
            }


            if (oPersistency.CalculationVersion.isSingle(iCalculationVersionId)) {
                const oCvIsSingleDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
                const sClientMsg = 'Calculation version cannot be deleted. The calculation should always have at least one calculation version.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_IS_SINGLE_ERROR, sClientMsg, oCvIsSingleDetails);
            }


            if (oPersistency.Calculation.isCurrentVersion(iCalculationVersionId)) {
                let oCvIsCurrentDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
                const sClientMsg = 'Calculation version cannot be deleted, because it is the current one for the calculation';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.DELETE_CURRENT_VERSION_ERROR, sClientMsg, oCvIsCurrentDetails);
            }


            await CalculationVersionService.checkIsVersionFrozen(oPersistency, iCalculationVersionId);


            await CalculationVersionService.checkIsLifecycleVersion(oPersistency, sSessionId, iCalculationVersionId);


            var aOpenLifecycleVersions = oPersistency.CalculationVersion.getOpenLifecycleVersionsForBaseVersion(iCalculationVersionId);
            if (aOpenLifecycleVersions.length > 0) {
                let oOpenLifecycleVersionDetails = new MessageDetails();
                await CalculationVersionService.addVersionStillOpenMessageDetails(oOpenLifecycleVersionDetails, aOpenLifecycleVersions);

                const sClientMsg = 'Calculation version cannot be deleted. It has opened lifecycle calculation version(s).';
                const sServerMsg = `${ sClientMsg } Calculation version id: '${ iCalculationVersionId }, opened lifecycle calculation version(s): ${ JSON.stringify(oOpenLifecycleVersionDetails) }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.LIFECYCLE_CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oOpenLifecycleVersionDetails);
            }


            await CalculationVersionService.checkLifecycleVersionsOfBaseVersionReferenced(oPersistency, iCalculationVersionId);


            await CalculationVersionService.checkIsLifecycleCalculationRunningForBaseVersion(oPersistency, sSessionId, iCalculationVersionId);




            var affectedRows = oPersistency.CalculationVersion.remove(iCalculationVersionId, sUserId);
            if (affectedRows < 1) {

                let oCvNotFoundDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
                const sClientMsg = 'Calculation version cannot be deleted. No db rows have been deleted.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR, sClientMsg, oCvNotFoundDetails);
            }





            var aMasterVersions = oPersistency.CalculationVersion.getMasterVersions(iCalculationVersionId);
            if (aMasterVersions.length > 0) {
                let aMasterVersion = _.map(aMasterVersions, function (oMasterVersion) {
                    return oMasterVersion.CALCULATION_VERSION_ID;
                });
                let oSourceVersionDetails = new MessageDetails().addCalculationVersionReferenceObjs({
                    id: iCalculationVersionId,
                    masterVersionsDetails: aMasterVersion
                });

                const sClientMsg = 'Calculation version cannot be deleted. It is referenced in other calculation version(s).';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }, referenced in calculation version(s): ${ JSON.stringify(oSourceVersionDetails) }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, oSourceVersionDetails);
            }
        });
    };















    this.patchSingle = async function (oBodyData, mParameters, oServiceOutput, oPersistency) {
        const iCvId = mParameters.calculation_version_id;

        if (!oPersistency.CalculationVersion.exists(iCvId)) {
            const sClientMsg = 'Calculation version does not exist.';
            const sServerMsg = `${ sClientMsg }. Id of the calculation version: ${ iCvId }`;
            $.trace.info(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        if (oBodyData.LOCK.IS_WRITEABLE == 1) {

            if (handleVersionLock(oServiceOutput, oPersistency, iCvId, oBodyData.LOCK.CONTEXT) === 1) {
                if (oBodyData.LOCK.CONTEXT === constants.CalculationVersionLockContext.VARIANT_MATRIX) {
                    oPersistency.Variant.copyToTemporaryTables(iCvId);
                }
                oServiceOutput.setStatus($.net.http.OK);
                return oServiceOutput;
            }
        } else {

            if (oPersistency.CalculationVersion.unlockVersion(iCvId, sSessionId, oBodyData.LOCK.CONTEXT) === 1) {
                oServiceOutput.setStatus($.net.http.OK);
                return oServiceOutput;
            }
        }











        oServiceOutput.setStatus($.net.http.EXPECTATION_FAILED);

        return oServiceOutput;
    };






















    async function handleVersionLock(oServiceOutput, oPersistency, iCvId, sLockContext = constants.CalculationVersionLockContext.CALCULATION_VERSION) {

        let iIsWritable = 0;

        var oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCvId });



        var oLock = oPersistency.CalculationVersion.setVersionLock(iCvId, sSessionId, sUserId, sLockContext);

        if (oLock.IsReference === true && oLock.LockingContext !== constants.CalculationVersionLockContext.VARIANT_MATRIX) {


            const sServerMsg = `Calculation version ${ iCvId } is source version.`;
            $.trace.info(sServerMsg);
            oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_SOURCE);
            let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.INFO, oMessageDetails);
            oServiceOutput.addMessage(message);
        } else if (oLock.IsFrozen) {

            const sServerMsg = `Calculation version ${ iCvId } is frozen.`;
            $.trace.info(sServerMsg);
            oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_FROZEN);
            let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
            oServiceOutput.addMessage(message);
        } else if (oLock.IsNotPrivileged) {

            const sServerMsg = `Calculation version ${ iCvId } can be displayed but not edited, because you do not have sufficient privileges to perform the operation.`;
            $.trace.info(sServerMsg);
            oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.NOT_AUTHORIZED_TO_EDIT);
            let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
            oServiceOutput.addMessage(message);
        } else if (sUserId !== oLock.LockingUser) {

            const sServerMsg = `Calculation version ${ iCvId } is locked by user ${ oLock.LockingUser }.`;
            $.trace.info(sServerMsg);

            oMessageDetails.addUserObj({ id: oLock.LockingUser });
            oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_BY_ANOTHER_USER);
            let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
            oServiceOutput.addMessage(message);
        } else if (sUserId === oLock.LockingUser && sLockContext === constants.CalculationVersionLockContext.CALCULATION_VERSION && oLock.LockingContext === constants.CalculationVersionLockContext.VARIANT_MATRIX && oLock.LockMode == 'write') {




            const sServerMsg = `Calculation version ${ iCvId } is locked by user himself in different application context (${ oLock.LockingContext })`;
            $.trace.info(sServerMsg);
            oMessageDetails.setNotWriteableEntityDetailsObj(MessageLibrary.NotWriteableEntityDetailsCode.IS_OPENED_IN_ANOTHER_CONTEXT);
            let message = new Message(Code.ENTITY_NOT_WRITEABLE_INFO, Severity.WARNING, oMessageDetails);
            oServiceOutput.addMessage(message);
        } else if (sUserId === oLock.LockingUser && oLock.LockMode == 'write') {

            iIsWritable = 1;
        }

        return iIsWritable;
    }

};
export default {_,helpers,constants,MetaInformation,ServiceParameters,CalculationVersionService,calculationVersionSearchDefaultValues,sDefaultExchangeRateType,oPriceDeterminationScenarios,MessageLibrary,PlcException,Message,Code,Severity,MessageDetails,Items,CalculationVersionSaveHandler};
