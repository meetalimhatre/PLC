const _ = require('lodash');
const Constants = require('../util/constants');
const CalculationServiceParameters = Constants.CalculationServiceParameters;
const ServiceParameters = Constants.ServiceParameters;
const ProjectService = require('../service/projectService');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const CalcEngineErrors = MessageLibrary.FormulaInterpreterErrorMapping;
const PlcMessage = MessageLibrary.Message;
const Severity = MessageLibrary.Severity;
const PlcException = MessageLibrary.PlcException;
const MessageCode = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const CostingSheetFormulaZeroDivisorErrorCode = 27;



/**
 * Contains common functions for handling calculation versions.
 */


/**
 * Adds calculated results for a calculation versions to service output:
 * 		- In case of saved (non-dirty) frozen versions, the saved calculated results are added 
 * 		- In other cases, the results are newly calculated.
 * 
 */
async function addCalculatedValuesToOutput(oValidatedRequestContent, oServiceOutput, oPersistency, sSessionId, sUserId) {
    var iCalculationVersionId;
    var oCalculationResult;

    /** Runs new calculation for a calculation version and adds the result to output
	 * 
	 */
    async function runCalculation() {
        const oResult = oPersistency.CalculationVersion.getCalculationResults(iCalculationVersionId, sSessionId);
        oCalculationResult = {};

        if (oValidatedRequestContent.parameters.compressedResult) {
            oCalculationResult.ITEM_CALCULATED_FIELDS_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_PRICES);
            oCalculationResult.ITEM_CALCULATED_VALUES_COSTING_SHEET_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET);
            oCalculationResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT);
        } else {

            oCalculationResult.ITEM_CALCULATED_FIELDS = Array.from(oResult.ITEM_CALCULATED_PRICES);
            oCalculationResult.ITEM_CALCULATED_VALUES_COSTING_SHEET = Array.from(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET);
            oCalculationResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT = Array.from(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT);
        }

        // Add custom fields currency values to calculated values from the AFL side
        if (oValidatedRequestContent.parameters.compressedResult) {
            oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS_COMPRESSED, oPersistency, true);
        } else {
            oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS, oPersistency, false);
        }

        // process errors from calculation procedure
        oCalculationResult.ERRORS = Array.from(oResult.ERRORS);
        _.each(oCalculationResult.ERRORS, async function (error) {
            var oDetails = new MessageDetails();
            // partial JSON error string is returned from CalcEngine
            oDetails.calculationEngineObj = JSON.parse('{' + error.ERROR_DETAILS + '}');
            // add itemId, which is in a separate column of the ERRORs table parameter
            oDetails.calculationEngineObj.itemId = error.ITEM_ID;

            // map CalcEngine error codes to XS layer error codes
            if (_.has(CalcEngineErrors, error.ERROR_CODE)) {
                var oErrorCode = CalcEngineErrors[error.ERROR_CODE];
            } else {
                const sLogMessage = `Invalid error code. See backend log for details. Invalid error code: ${ error.ERROR_CODE }.`;
                await logError(sLogMessage);
                throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
            if (_.isMatch('FAKE_CUSTOM_BOOL', oDetails.calculationEngineObj.columnId)) {
                oDetails.calculationEngineObj.columnId = 'TOTAL_COST';
                oErrorCode = CalcEngineErrors[CostingSheetFormulaZeroDivisorErrorCode];
            }
            var oError = new PlcMessage(oErrorCode, Severity.WARNING, oDetails, 'Calculate');
            oServiceOutput.addMessage(oError);
        });

        delete oCalculationResult.ERRORS;
    }

    /** Determine calculation version for which the calculated results should be delivered.
	 * The calculation version can appear in different parts of the request or response.
	 * 
	 */
    async function determineCalculationVersion() {
        var iValidVersionId;

        async function tryGetExistingCalculationVersionId(iVersion) {
            iValidVersionId = iVersion;
            return await helpers.isNullOrUndefined(iVersion) === false;
        }

        async function tryGetVersionFromRequestBody() {
            if (oValidatedRequestContent.data !== undefined && oValidatedRequestContent.data[0] !== undefined) {
                if (await tryGetExistingCalculationVersionId(oValidatedRequestContent.data[0].CALCULATION_VERSION_ID) === true) {
                    return true;
                }
            }
            return false;
        }

        // Central logic on selecting the version id from different parts of request or response
        if (oValidatedRequestContent.parameters.action !== ServiceParameters.Copy && oValidatedRequestContent.parameters.action !== CalculationServiceParameters.CopyVersion && await tryGetExistingCalculationVersionId(oValidatedRequestContent.parameters.id) === true) {
            return iValidVersionId;
        } else if (await tryGetVersionFromRequestBody() === true) {
            return iValidVersionId;
        } else if (oServiceOutput.payload.body !== undefined) {
            if (oServiceOutput.payload.body.transactionaldata !== undefined) {
                var oTransactionalData = oServiceOutput.payload.body.transactionaldata;
                if (oTransactionalData[0] !== undefined) {
                    if (oTransactionalData[0].CALCULATION_VERSIONS !== undefined) {
                        if (await tryGetExistingCalculationVersionId(oTransactionalData[0].CALCULATION_VERSIONS[0].CALCULATION_VERSION_ID) === true) {
                            return iValidVersionId;
                        }
                    } else {
                        if (await tryGetExistingCalculationVersionId(oTransactionalData[0].CALCULATION_VERSION_ID) === true) {
                            return iValidVersionId;
                        }
                    }
                }
            }
        }
        return undefined;
    }


    if (_.isBoolean(oValidatedRequestContent.parameters.calculate) && oValidatedRequestContent.parameters.calculate === true) {
        iCalculationVersionId = await determineCalculationVersion();

        if (iCalculationVersionId === undefined) {
            const sLogMessage = 'Calculation version to be calculated was not identified.';
            await logError(sLogMessage);
            throw new PlcException(MessageCode.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        } else {
            if (oPersistency.CalculationVersion.isFrozen(iCalculationVersionId) === true && oPersistency.CalculationVersion.isDirty(iCalculationVersionId, sSessionId, sUserId) === false) {
                // for frozen and not changed calculations, the saved calculation results should be set to output
                const oResult = oPersistency.CalculationVersion.getSavedCalculationResults(iCalculationVersionId);
                oCalculationResult = {};

                if (oValidatedRequestContent.parameters.compressedResult) {
                    oCalculationResult.ITEM_CALCULATED_FIELDS_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_FIELDS);
                    oCalculationResult.ITEM_CALCULATED_VALUES_COSTING_SHEET_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET);
                    oCalculationResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT_COMPRESSED = await helpers.transposeResultArray(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT);
                } else {
                    oCalculationResult.ITEM_CALCULATED_FIELDS = Array.from(oResult.ITEM_CALCULATED_FIELDS);
                    oCalculationResult.ITEM_CALCULATED_VALUES_COSTING_SHEET = Array.from(oResult.ITEM_CALCULATED_VALUES_COSTING_SHEET);
                    oCalculationResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT = Array.from(oResult.ITEM_CALCULATED_VALUES_COMPONENT_SPLIT);
                }

                // Add custom fields currency values to calculated values from the AFL side
                if (oValidatedRequestContent.parameters.compressedResult) {
                    oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS_COMPRESSED, oPersistency, true);
                } else {
                    oPersistency.CalculationVersion.addCurrencyUnitsToCalculationResults(iCalculationVersionId, oCalculationResult.ITEM_CALCULATED_FIELDS, oPersistency, false);
                }
            } else {
                // for other cases, the calculation results should be calculated
                await runCalculation();
            }

            oServiceOutput.setCalculationResult(oCalculationResult);
        }

    }
}

/**
 * Function used whether a calculation version/calculation is copied.
 * Check if calculation version exists in calculation version table (also in calculation version temporary table).
 * @throws {PlcException}
 *             If calculation version does not exists.
 * @throws {PlcException}
 *             If calculation version exists only in calculation version temporary table.
 */
async function checkIfVersionExists(oPersistency, sSessionId, iCalculationVersionId, oMessageDetails) {
    var bCalcVersionExist = oPersistency.CalculationVersion.exists(iCalculationVersionId);
    if (!bCalcVersionExist) {
        bCalcVersionExist = oPersistency.CalculationVersion.existsCVTemp(iCalculationVersionId, sSessionId);
        if (bCalcVersionExist) {
            const sLogMessage = 'The version is a temporary calculation version. Please save the calculation version and try again.';
            await logError(sLogMessage);
            throw new PlcException(MessageCode.CALCULATIONVERSION_IS_TEMPORARY_ERROR, sLogMessage);
        } else {
            const sClientMsg = 'Calculation version not found.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
            await logError(sServerMsg);
            throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }
    }
}

/**
 * Function to check whether a calculation exists.
 * This function is used in calculation-versions and calculations services.
 * @throws {PlcException} -
 *             If calculation no longer exists.
 */
async function checkIfCalculationExists(oPersistency, iCalculationId, oMessageDetails) {
    if (!oPersistency.Calculation.exists(iCalculationId)) {
        const sClientMsg = 'Calculation not found.';
        const sServerMsg = `${ sClientMsg } Calculation id: ${ iCalculationId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
}

/**
 * Check if calculation version is frozen.
 * @throws {PlcException} -
 *             If calculation version is frozen.
 */
async function checkIsVersionFrozen(oPersistency, iCalculationVersionId) {
    if (oPersistency.CalculationVersion.isFrozen(iCalculationVersionId)) {
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sClientMsg = 'Calculation version is frozen.';
        const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.CALCULATIONVERSION_IS_FROZEN_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Check if calculation version is of type lifecycle.
 */
async function checkIsLifecycleVersion(oPersistency, sSessionId, iCalculationVersionId, bCheckTemporaryTable) {
    bCheckTemporaryTable = bCheckTemporaryTable ? bCheckTemporaryTable : false;
    const bIsLifecycleVersion = oPersistency.CalculationVersion.isLifecycleVersion(iCalculationVersionId, bCheckTemporaryTable) === true;
    const bIsManualLifecycleVersion = oPersistency.CalculationVersion.isManualLifecycleVersion(iCalculationVersionId, bCheckTemporaryTable) === true;
    if (bIsLifecycleVersion || bIsManualLifecycleVersion) {
        const oMessageDetails = new MessageDetails().addCalculationVersionObjs({ id: iCalculationVersionId });
        const sClientMsg = 'Calculation version is of type lifecycle.';
        const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalculationVersionId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.CALCULATIONVERSION_IS_LIFECYCLE_VERSION_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Check if any lifecycle version of given base version is referenced by any other version
 */
async function checkLifecycleVersionsOfBaseVersionReferenced(oPersistency, iCalculationVersionId) {

    let aReferencedLifecycleVersions = oPersistency.CalculationVersion.getLifecycleMasterVersionsForBaseVersion(iCalculationVersionId);

    if (aReferencedLifecycleVersions.length > 0) {

        let aLifecycleVersionIds = [];
        let aReferencingVersionIds = [];
        let aReferencingBaseVersionsIds = [];

        // Get arrays of version ids 
        _.each(aReferencedLifecycleVersions, oLifecycleVersion => {
            aLifecycleVersionIds.push(oLifecycleVersion.LIFECYCLE_VERSION_ID);
            aReferencingVersionIds.push(oLifecycleVersion.REFERENCING_VERSION_ID);
            aReferencingBaseVersionsIds.push(oLifecycleVersion.REFERENCING_BASE_VERSION_ID);
        });

        // Add only unique ids values to message details
        const oMessageDetails = {
            id: iCalculationVersionId,
            lifecycleVersions: _.uniq(aLifecycleVersionIds),
            referencingLifecycleVersions: _.uniq(aReferencingVersionIds),
            referencingBaseVersions: _.uniq(aReferencingBaseVersionsIds)
        };

        const sClientMsg = 'Lifecycle versions of base calculation version are referenced by other versions and cannot be deleted.';
        const sServerMsg = `${ sClientMsg } Base calculation version id: ${ iCalculationVersionId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.LIFECYCLE_CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg, new MessageDetails().addLifecycleCalculationVersionReferenceObjs(oMessageDetails));
    }
}


/**
 * Check if lifecycle calculation is running for the project of the given base version.
 */
async function checkIsLifecycleCalculationRunningForBaseVersion(oPersistency, sSessionId, iCalculationVersionId) {
    let sProjectId = oPersistency.CalculationVersion.getProjectPropertiesForCalculationVersion(iCalculationVersionId, false).PROJECT_ID;

    await ProjectService.checkLifecycleCalculationRunningForProject(oPersistency, sProjectId);
}

/**
 * Checks whether the calculation version name is unique within (in scope of) the provided calculation identified by id. 
 * @throws {PlcException}
 *             If calculation version name is not unique.
 */
async function isNameUnique(oPersistency, iCalculationId, iCalculationVersionId, sCalcVersionName, oMessageDetails) {
    if (!await oPersistency.CalculationVersion.isNameUnique(iCalculationId, iCalculationVersionId, sCalcVersionName)) {
        const sLogMessage = `Calculation version name not unique: ${ sCalcVersionName }.`;
        await logError(sLogMessage);
        throw new PlcException(MessageCode.CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR, sLogMessage, oMessageDetails);
    }
}

/**
 * Function to check whether a calculation version is opened in write mode (lock=1) in the current session.
 * @throws {PlcException}
 *             If calculation version is not opened and locked.
 */
async function isOpenedAndLockedInSession(oPersistency, sSessionId, iCalcVersionId, oMessageDetails) {
    if (!oPersistency.CalculationVersion.isOpenedAndLockedInSessionAndContext(sSessionId, iCalcVersionId, Constants.CalculationVersionLockContext.CALCULATION_VERSION)) {
        const sClientMsg = 'Calculation version not opened and locked.';
        const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }.`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.CALCULATIONVERSION_NOT_WRITABLE_ERROR, sClientMsg, oMessageDetails);
    }
}

/**
 * Prepares an object which shall be used used as service output in it's stringified form. It takes the result object of the
 * {@linkcode persistency#openCalculationVersion} function and additionally basic data for component split and costing sheet. All data is
 * combined and returned in one sole object.
 */
async function prepareOutput(oReadCalculationOutput, bOmitItems) {
    var oOutputObject = oReadCalculationOutput.version;
    if (bOmitItems === false || await helpers.isNullOrUndefined(bOmitItems)) {
        oOutputObject.ITEMS = oReadCalculationOutput.items;
    } else {
        oOutputObject.ITEMS = [];
    }
    oOutputObject.ITEMS_COMPRESSED = oReadCalculationOutput.itemsCompressed;
    return oOutputObject;
}

/**
*	Helper function to add the calculation version message details in case the calculation versions of the business object (project, version) are still open and an action cannot be performed. It
*   expects an array with objects {CALCULATION_VERSION_ID: <>, CALCULATION_VERSION_NAME: <>, USER_ID: <> ...}
*/
function addVersionStillOpenMessageDetails(oCvOpenDetails, aOpenVersions) {
    // group by the version allows to collect all users who have opened a specific version
    var mGroupedByVersionId = _.groupBy(aOpenVersions, oOpenVersion => {
        return oOpenVersion.CALCULATION_VERSION_ID;
    });

    // after grouping by, this code iterates over all the groups to create the needed calculation version
    // details object and add it to the message details
    _.each(mGroupedByVersionId, aOpenVersion => {
        var aOpeningUserDetailsForCv = _.map(aOpenVersion, oOpenVersion => {
            return { id: oOpenVersion.USER_ID };
        });

        var oCvMessageDetails = {
            id: aOpenVersion[0].CALCULATION_VERSION_ID,
            name: aOpenVersion[0].CALCULATION_VERSION_NAME,
            openingUsers: aOpeningUserDetailsForCv
        };
        oCvOpenDetails.addCalculationVersionObjs(oCvMessageDetails);
    });
}

async function logError(msg) {
    await helpers.logError(msg);
}

module.exports.addCalculatedValuesToOutput = addCalculatedValuesToOutput;
module.exports.checkIfVersionExists = checkIfVersionExists;
module.exports.checkIfCalculationExists = checkIfCalculationExists;
module.exports.checkIsVersionFrozen = checkIsVersionFrozen;
module.exports.checkIsLifecycleVersion = checkIsLifecycleVersion;
module.exports.checkLifecycleVersionsOfBaseVersionReferenced = checkLifecycleVersionsOfBaseVersionReferenced;
module.exports.checkIsLifecycleCalculationRunningForBaseVersion = checkIsLifecycleCalculationRunningForBaseVersion;
module.exports.isNameUnique = isNameUnique;
module.exports.isOpenedAndLockedInSession = isOpenedAndLockedInSession;
module.exports.prepareOutput = prepareOutput;
module.exports.addVersionStillOpenMessageDetails = addVersionStillOpenMessageDetails;
export default {_,Constants,CalculationServiceParameters,ServiceParameters,ProjectService,helpers,MessageLibrary,CalcEngineErrors,PlcMessage,Severity,PlcException,MessageCode,MessageDetails,CostingSheetFormulaZeroDivisorErrorCode,addCalculatedValuesToOutput,checkIfVersionExists,checkIfCalculationExists,checkIsVersionFrozen,checkIsLifecycleVersion,checkLifecycleVersionsOfBaseVersionReferenced,checkIsLifecycleCalculationRunningForBaseVersion,isNameUnique,isOpenedAndLockedInSession,prepareOutput,addVersionStillOpenMessageDetails,logError};
