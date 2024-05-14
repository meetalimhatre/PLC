const _ = require('lodash');
const helpers = require('../util/helpers');
const Constants = require('../util/constants');
const MetaInformation = Constants.ServiceMetaInformation;
const CalculationServiceParameters = Constants.CalculationServiceParameters;

const calculationVersionService = require('../service/calculationVersionService');
const ProjectService = require('../service/projectService');
const ItemService = require('../service/itemService');
const SessionService = require('../service/sessionService');

const ServiceOutput = require('../util/serviceOutput');
const sDefaultExchangeRateType = Constants.sDefaultExchangeRateType;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const MessageCode = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;
const Message = MessageLibrary.Message;

module.exports.Calculations = function ($) {

    var sSessionId;
    var sUserId;
    sSessionId = sUserId = $.getPlcUsername();

    var that = this;

    /**
 * Handles a GET request towards the calculations.xsjs resource to get all calculations (or calculations for some projects). The method determines all
 * calculations registered in the database.
 * 
 * @returns {ServiceOutput} - an instance of the ServiceOutput which encapsulates the payload produced by this method
 *          and additional metadata such as messages or status.
 */
    this.get = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        var oMessageDetails = new MessageDetails();
        var aCalculations = [];
        var aCalculationIds = [];
        var aProjectIds = [];
        var itopPerProject = aParameters.topPerProject;
        const sSearchCriteria = aParameters.searchAutocomplete || '';
        const iTopCalculations = aParameters.top;

        var oGetCalculationsOutput = [];

        if (_.has(aParameters, 'project_id')) {
            aProjectIds = aParameters.project_id.split(',');
            oPersistency.Project.checkProjectsExist(aProjectIds, sUserId);
        }

        if (_.has(aParameters, 'calculation_id')) {
            aCalculationIds = aParameters.calculation_id.split(',');
        }

        if (_.has(aParameters, 'project_id') || _.has(aParameters, 'calculation_id')) {
            oGetCalculationsOutput = oPersistency.Calculation.getSaved(aProjectIds, sUserId, aCalculationIds, itopPerProject, sSearchCriteria, iTopCalculations);
        } else {
            oGetCalculationsOutput = oPersistency.Calculation.get(aProjectIds, sUserId, aCalculationIds, itopPerProject, sSearchCriteria, iTopCalculations);
        }

        aCalculations = oGetCalculationsOutput.calculations;

        oServiceOutput.setTransactionalData(aCalculations);
        return oServiceOutput;
    };

    /**
 * Handles a HTTP POST requests to add a new calculation. The method checks if the received object contains all
 * necessary property. After that it triggers the persistency instance to create the db objects for the calculation and
 * for nested objects. The expected input is a hierarchical JavaScript object which combines calculations, versions and
 * root items, e.g. { "CALCULATION_ID":1, ..., "CALCULATION_VERSIONS":[ {"CALCULATION_VERSION_ID":2, ... "ITEMS":[ {
 * "ITEM_ID":3 } ] } ] } ] The returned object is the input extended with generated values like Id of new calculation.
 *
 * @returns {oServiceOutput} - an instance of the ServiceOutput which encapsulates the payload produced by this method
 *          and additional metadata such as messages or status.
 */
    this.create = function (oBodyData, aParameters, oServiceOutput, oPersistency) {
        var oMessageDetails = new MessageDetails();
        var sSessionId;
        var sUserId;
        sSessionId = sUserId = $.getPlcUsername();

        async function setDefaultValues(oCalculation) {
            // get default values from the project
            var oDefaultSettings = oPersistency.Project.getProjectProperties(oCalculation.PROJECT_ID);

            if (helpers.isNullOrUndefined(oDefaultSettings)) {
                const sClientMsg = 'Project does not exist or its default settings are missing in calculation.';
                const sServerMsg = `${ sClientMsg } Project: ${ oCalculation.PROJECT_ID }, calculation; ${ oCalculation.CALCULATION_ID }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            } else {


                _.each(oCalculation.CALCULATION_VERSIONS, async function (oCv) {
                    await helpers.setDefaultValuesForCalculationVersion(oCv, oDefaultSettings);
                    if (helpers.isNullOrUndefined(oCv.EXCHANGE_RATE_TYPE_ID)) {

                        oCv.EXCHANGE_RATE_TYPE_ID = sDefaultExchangeRateType;
                    }
                });
            }
        }

        oMessageDetails.addUserObj({ id: sUserId });

        SessionService.checkSessionIsOpened(oPersistency, sSessionId, sUserId);

        var aResponseContent = [];
        _.each(oBodyData, async function (oCalcToCreate) {
            await setDefaultValues(oCalcToCreate);

            var oCreatedCalculation = await oPersistency.Calculation.create(oCalcToCreate, sSessionId, sUserId);

            if (_.isNull(oCreatedCalculation)) {
                oServiceOutput.setStatus($.net.http.CONFLICT);
            } else {


                var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
                _.each(oCreatedCalculation.CALCULATION_VERSIONS, function (oCv) {
                    var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCv.CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);

                    oServiceOutput.addMasterdata(mCalculationMasterdata);
                });


                oCreatedCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty] = oCreatedCalculation.CALCULATION_VERSIONS[0].ITEMS[0].IS_DIRTY;

                aResponseContent.push(oCreatedCalculation);
            }
        });

        if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
            oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
        }
    };









    async function createCalculationAsCopy(oBodyData, aParameters, oServiceOutput, oPersistency) {
        var sSessionId;
        var sUserId;
        sSessionId = sUserId = $.getPlcUsername();






        async function processItemsWithResetNontemporaryMasterdata(oCopiedCalcVersion, oChangedMasterdataCounts, aCopiedItems) {

            if (oChangedMasterdataCounts.CHANGED_COSTING_SHEET_COUNT > 0) {
                oServiceOutput.addMessage(await new Message(MessageCode.CALCULATIONVERSION_COSTING_SHEET_SET_TO_NULL_WARNING, Severity.WARNING, new MessageDetails().addCalculationVersionObjs({ id: oCopiedCalcVersion.CALCULATION_VERSION_ID })));

                oCopiedCalcVersion.COSTING_SHEET_ID = null;
            }

            if (oChangedMasterdataCounts.CHANGED_COMPONENT_SPLIT_COUNT > 0) {
                oServiceOutput.addMessage(await new Message(MessageCode.CALCULATIONVERSION_COMPONENT_SPLIT_SET_TO_NULL_WARNING, Severity.WARNING, new MessageDetails().addCalculationVersionObjs({ id: oCopiedCalcVersion.CALCULATION_VERSION_ID })));

                oCopiedCalcVersion.COMPONENT_SPLIT_ID = null;
            }

            if (oChangedMasterdataCounts.CHANGED_ITEMS_WITH_RESET_ACCOUNTS.length > 0) {
                oServiceOutput.addMessage(await new Message(MessageCode.CALCULATIONVERSION_ACCOUNTS_SET_TO_NULL_WARNING, Severity.WARNING, new MessageDetails().addCalculationVersionObjs({ id: oCopiedCalcVersion.CALCULATION_VERSION_ID })));


                var aChangedAccountItemIds = _.map(oChangedMasterdataCounts.CHANGED_ITEMS_WITH_RESET_ACCOUNTS, 'ITEM_ID');
                _.each(aCopiedItems, function (oItem) {
                    if (_.includes(aChangedAccountItemIds, oItem.ITEM_ID)) {
                        oItem.ACCOUNT_ID = null;
                    }
                });
            }
        }








        async function determineAccountsAndPricesForAnotherControllingArea(oCopy) {

            var aCopiedItems = [];
            _.each(oCopy.items, function (oItem) {
                aCopiedItems.push(_.clone(oItem));
            });

            var oCopiedCalcVersion = oCopy.version;


            var oChangedMasterdataCounts = oPersistency.CalculationVersion.resetMissingNontemporaryMasterdata(oCopiedCalcVersion.CALCULATION_VERSION_ID, sSessionId);
            await processItemsWithResetNontemporaryMasterdata(oCopiedCalcVersion, oChangedMasterdataCounts, aCopiedItems);


            var oAutomaticallyDeterminedValuesResult = oPersistency.Item.automaticValueDetermination(aCopiedItems, oCopiedCalcVersion.CALCULATION_VERSION_ID, sSessionId);

            var mAutomaticallyDeterminedValues = {};



            _.each(oAutomaticallyDeterminedValuesResult.VALUES, function (oDeterminedValuesItem) {
                mAutomaticallyDeterminedValues[oDeterminedValuesItem.ITEM_ID] = _.pickBy(oDeterminedValuesItem, function (value) {
                    return value !== null && value !== undefined;
                });
                mAutomaticallyDeterminedValues[oDeterminedValuesItem.ITEM_ID].ACCOUNT_ID = oDeterminedValuesItem.ACCOUNT_ID;
            });

            await ItemService.processValueDeterminationMessages(oAutomaticallyDeterminedValuesResult.MESSAGES, oServiceOutput);


            _.each(aCopiedItems, async function (oItemToUpdate) {
                var oAutomaticallyDeterminedItemValues = mAutomaticallyDeterminedValues[oItemToUpdate.ITEM_ID] || {};
                if (!helpers.isNullOrUndefined(oAutomaticallyDeterminedItemValues)) {
                    _.extend(oItemToUpdate, oAutomaticallyDeterminedItemValues);

                    await ItemService.doUpdate(oItemToUpdate, oPersistency, sSessionId);
                }
            });

            oCopy.items = aCopiedItems;
        }

        var aResponseContent = [];
        var iCalcVersionId = parseInt(aParameters.id, 10);

        var oCalculation = oBodyData;
        var oMessageDetails = new MessageDetails();
        oMessageDetails.addCalculationVersionObjs({ id: iCalcVersionId });

        SessionService.checkSessionIsOpened(oPersistency, sSessionId, sUserId);


        await calculationVersionService.checkIfVersionExists(oPersistency, sSessionId, iCalcVersionId, oMessageDetails);

        var sTargetProjectId = oCalculation.PROJECT_ID;
        var bControllingAreaChanged = false;
        var oCurrentProjectProperties = oPersistency.CalculationVersion.getProjectPropertiesForCalculationVersion(iCalcVersionId, false);

        if (sTargetProjectId !== oCurrentProjectProperties.PROJECT_ID) {

            var oTargetProjectProperties = oPersistency.Project.getProjectProperties(sTargetProjectId);
            if (helpers.isNullOrUndefined(oTargetProjectProperties)) {
                const sClientMsg = 'Target project does not exist.';
                const sServerMsg = `${ sClientMsg } Target project id: ${ sTargetProjectId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            }


            if (oTargetProjectProperties.CONTROLLING_AREA_ID !== oCurrentProjectProperties.CONTROLLING_AREA_ID) {
                bControllingAreaChanged = true;
            }
        }
        var mSessionDetails = oPersistency.Session.getSessionDetails($.getPlcUsername(), $.getPlcUsername());


        const oCopy = await oPersistency.Calculation.createCalculationAsCopy(iCalcVersionId, sTargetProjectId, sSessionId, sUserId, mSessionDetails.language);

        if (bControllingAreaChanged === true) {
            await determineAccountsAndPricesForAnotherControllingArea(oCopy);
        }

        var oCopiedCalculation = oCopy.calculation;
        oCopiedCalculation.CALCULATION_VERSIONS = [oCopy.version];

        var mCalculationMasterdata = oPersistency.Administration.getMasterdataForCalculationVersion(oCopiedCalculation.CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID, mSessionDetails.language, sSessionId);
        oServiceOutput.addMasterdata(mCalculationMasterdata);
        oServiceOutput.setReferencesData(oCopy.referencesdata);

        let iIsDirty = oCopy.items.length > 0 ? 1 : 0;
        oCopiedCalculation.CALCULATION_VERSIONS[0][MetaInformation.IsDirty] = iIsDirty;

        const bCompressedResult = aParameters.compressedResult ? aParameters.compressedResult : false;
        if (bCompressedResult) {
            oCopiedCalculation.CALCULATION_VERSIONS[0].ITEMS_COMPRESSED = await helpers.transposeResultArrayOfObjects(oCopy.items, false);
        } else {
            oCopiedCalculation.CALCULATION_VERSIONS[0].ITEMS = oCopy.items;
        }

        aResponseContent.push(oCopiedCalculation);
        if (aResponseContent.length > 0 && oServiceOutput.status !== $.net.http.CONFLICT) {
            oServiceOutput.setTransactionalData(aResponseContent).setStatus($.net.http.CREATED);
        }
    }










    this.handlePostRequest = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {
        var sActionParameter = aParameters.action;
        var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);

        if (sActionParameter === CalculationServiceParameters.Create) {
            await that.create(oBodyData, aParameters, oServiceOutput, oPersistency);
        } else if (sActionParameter === CalculationServiceParameters.CopyVersion) {
            await createCalculationAsCopy(oBodyData, aParameters, oServiceOutput, oPersistency, mSessionDetails.language);
        } else {
            const sLogMessage = `Action Parameter is neither ${ CalculationServiceParameters.New } nor ${ CalculationServiceParameters.CopyVersion } but creation is triggered.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
    };










    this.remove = function (oBodyData, aParameters, oServiceOutput, oPersistency) {

        var aValidProjectIds = new Set();
        _.each(oBodyData, async function (oCalculation) {

            var iCalculationId = parseInt(oCalculation.CALCULATION_ID, 10);


            await checkForOpenVersions(oPersistency, iCalculationId);


            var aSourceVersions = oPersistency.Calculation.getSourceVersionsWithMasterVersionsFromDifferentCalculations(iCalculationId);
            if (aSourceVersions.length > 0) {
                let aSourceVersion = _.map(aSourceVersions, function (oSourceVersion) {
                    return oSourceVersion.CALCULATION_VERSION_ID;
                });
                let oSourceVersionDetails = new MessageDetails().addCalculationReferenceObjs({
                    id: iCalculationId,
                    sourceVersions: aSourceVersion
                });

                const sClientMsg = 'Calculation cannot be deleted, since it contains source versions used in other calculations.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, oSourceVersionDetails);
            }


            var aFrozenCalculationVersions = oPersistency.Calculation.getFrozenVersions(iCalculationId);
            if (aFrozenCalculationVersions.length > 0) {
                let oCalculationNotFoundDetails = new MessageDetails().addCalculationObjs({ id: iCalculationId });

                const sClientMsg = 'Calculation cannot be deleted because it contains frozen versions.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId } `;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oCalculationNotFoundDetails);
            }


            await calculationVersionService.checkIfCalculationExists(oPersistency, iCalculationId);



            let oSavedCalculation = oPersistency.Calculation.getCurrentCalculationData(iCalculationId);
            await ProjectService.checkLifecycleCalculationRunningForProject(oPersistency, oSavedCalculation.PROJECT_ID);




            var affectedRows = oPersistency.Calculation.remove(iCalculationId);
            if (affectedRows < 1) {
                let oCalculationNotFoundDetails = new MessageDetails().addCalculationObjs({ id: iCalculationId });

                const sClientMsg = 'Calculation cannot be deleted. Delete affected 0 rows.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR, sClientMsg, oCalculationNotFoundDetails);
            } else {
                aValidProjectIds.add(oSavedCalculation.PROJECT_ID);
            }
        });
        aValidProjectIds.forEach(sProjectId => {
            oPersistency.Project.recalculateOneTimeCostForProject(sProjectId);
        });
    };








    this.update = function (oBodyData, aParameters, oServiceOutput, oPersistency) {
        var sSessionId;
        var sUserId;
        sSessionId = sUserId = $.getPlcUsername();
        var oMessageDetails = new MessageDetails();
        oServiceOutput.setStatus($.net.http.OK);
        var dLastModifiedOn;
        var aUpdatedCalculations = [];

        _.each(oBodyData, async function (oCalculation, iIndex) {
            var iCalculationId = oCalculation.CALCULATION_ID;

            dLastModifiedOn = oCalculation.LAST_MODIFIED_ON;
            oMessageDetails.addCalculationObjs({ id: iCalculationId });


            var oCurrentCalculation = oPersistency.Calculation.getCurrentCalculationData(iCalculationId);

            var dCurrentCalcLastModified = oCurrentCalculation.LAST_MODIFIED_ON;
            if (_.isString(dCurrentCalcLastModified)) {
                dCurrentCalcLastModified = new Date(Date.parse(dCurrentCalcLastModified));
            }


            var iCalculationVersionId = oCalculation.CURRENT_CALCULATION_VERSION_ID;
            if (!oPersistency.CalculationVersion.exists(iCalculationVersionId) && !oPersistency.CalculationVersion.existsCVTemp(iCalculationVersionId, sSessionId)) {

                oMessageDetails = new MessageDetails();
                oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

                const sClientMsg = 'Calculation version has been deleted. Update not possible.';
                const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg, oMessageDetails);
            }

            if (oCalculation.CURRENT_CALCULATION_VERSION_ID !== oCurrentCalculation.CURRENT_CALCULATION_VERSION_ID && oPersistency.CalculationVersion.isLifecycleVersion(iCalculationVersionId)) {
                oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });

                const sClientMsg = "Current calculation version for calculation could not be set to calculation version because it's a lifecycle version.";
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }, calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR, sClientMsg, oMessageDetails);
            }


            const bVersionBelongsToCalculation = oPersistency.Calculation.IsCalculationVersionInCalculation(iCalculationVersionId, iCalculationId);
            if (!bVersionBelongsToCalculation) {
                oMessageDetails.addCalculationVersionObjs({ id: iCalculationVersionId });
                const sClientMsg = 'This version does not belong to the given calculation.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }, calculation version id: ${ iCalculationVersionId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_PART_OF_CALCULATION_ERROR, sClientMsg, oMessageDetails);
            }


            var oTargetProjectDefaults = oPersistency.Project.getProjectProperties(oCalculation.PROJECT_ID);
            if (helpers.isNullOrUndefined(oTargetProjectDefaults)) {
                const sClientMsg = 'Project does not exist.';
                const sServerMsg = `${ sClientMsg } Project id: ${ oCalculation.PROJECT_ID }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            }


            if (oCurrentCalculation.PROJECT_ID !== oCalculation.PROJECT_ID) {
                var oCurrentProjectDefaults = oPersistency.Project.getProjectProperties(oCurrentCalculation.PROJECT_ID);
                if (oCurrentProjectDefaults.CONTROLLING_AREA_ID !== oTargetProjectDefaults.CONTROLLING_AREA_ID) {
                    const sClientMsg = 'Different controlling areas in calculation and target projects.';
                    const sServerMsg = `${ sClientMsg } Calculation project: ${ oCurrentProjectDefaults.CONTROLLING_AREA_ID }, target project: ${ oTargetProjectDefaults.CONTROLLING_AREA_ID }.`;
                    $.trace.error(sServerMsg);
                    throw new PlcException(MessageCode.DIFFERENT_CONTROLLING_AREA_IN_TARGET_PROJECT, sClientMsg);
                }


                await checkForOpenVersions(oPersistency, iCalculationId);


                oPersistency.Project.updateCostNotDistributedForOneTimeProjectCostWhenCalculationGetsDeleted(oCurrentCalculation.PROJECT_ID, oCalculation.CALCULATION_ID);
                oPersistency.Project.deleteOneTimeCostRelatedDataForProjectIdAndCalculationId(oCurrentCalculation.PROJECT_ID, oCalculation.CALCULATION_ID);
                oPersistency.Project.recalculateOneTimeCostForProject(oCurrentCalculation.PROJECT_ID);
            }

            var bNameChanged = oCurrentCalculation.CALCULATION_NAME !== oCalculation.CALCULATION_NAME;
            var bProjectChanged = oCurrentCalculation.PROJECT_ID !== oCalculation.PROJECT_ID;
            if ((bProjectChanged || bNameChanged) && !await oPersistency.Calculation.isNameUnique(oCalculation)) {

                const sClientMsg = 'Calculation name could not be updated. It has to be unique.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }, new name:  ${ oCalculation.CALCULATION_NAME }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.CALCULATION_NAME_NOT_UNIQUE_ERROR, sClientMsg, oMessageDetails);
            }

            if (dCurrentCalcLastModified.getTime() !== dLastModifiedOn.getTime()) {

                oServiceOutput.setTransactionalData(oCurrentCalculation);

                const sClientMsg = 'Calculation not current, it has been updated by others.';
                const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_CURRENT_ERROR, sClientMsg, oMessageDetails);
            }

            var oUpdateResult = await oPersistency.Calculation.update(oCalculation);
            aUpdatedCalculations.push(oUpdateResult.calculation);

        });
        oServiceOutput.setTransactionalData(aUpdatedCalculations);
    };

    async function checkForOpenVersions(oPersistency, iCalculationId) {







        var aDbOpeningUsers = oPersistency.Calculation.getOpeningUsersForVersions(iCalculationId);
        if (aDbOpeningUsers.length > 0) {
            var oCvStillOpenDetails = new MessageDetails().addCalculationObjs({ id: iCalculationId });

            var mUserIdGroupedByCalculationVersion = _.groupBy(aDbOpeningUsers, function (oDbOpeningUser) {
                return oDbOpeningUser.CALCULATION_VERSION_ID;
            });




            _.each(mUserIdGroupedByCalculationVersion, function (aDbOpeningUser) {
                var aOpeningUserDetailsForCv = _.map(aDbOpeningUser, function (oDbOpeningUser) {
                    return { id: oDbOpeningUser.USER_ID };
                });

                var oCvMessageDetails = {
                    id: aDbOpeningUser[0].CALCULATION_VERSION_ID,
                    name: aDbOpeningUser[0].CALCULATION_VERSION_NAME,
                    openingUsers: aOpeningUserDetailsForCv
                };

                oCvStillOpenDetails.addCalculationVersionObjs(oCvMessageDetails);
            });

            const sClientMsg = 'Calculation cannot be deleted. Already opened by other users.';
            const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }, opening users: ${ JSON.stringify(aDbOpeningUsers) }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(MessageCode.CALCULATIONVERSION_IS_STILL_OPENED_ERROR, sClientMsg, oCvStillOpenDetails);
        }
    }

};
export default {_,helpers,Constants,MetaInformation,CalculationServiceParameters,calculationVersionService,ProjectService,ItemService,SessionService,ServiceOutput,sDefaultExchangeRateType,MessageLibrary,PlcException,MessageCode,Severity,MessageDetails,Message};
