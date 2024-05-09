const _ = require('lodash');
const Constants = require('../util/constants');
const MetaInformation = Constants.ServiceMetaInformation;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;


/**
 * This handler encapsulates the logic to perform save and save-as operations for calculation versions. It is meant to centralize the logic 
 * and avoid code duplications for steps necessary for save as well as save as. It implements the Builder pattern in order to enforce 
 * the correct protocol to perform the save operations and provides a fluent API to enable method chaining. 
 * 
 * @constructor
 *  
 * @param  {object} oCalculationVersion        The calculation version for which the save/save-as shall be performed 
 * @param  {object} oCalculationVersionService An instance of CalculationVersionService to perform checks and centralized pieces of the logic
 * @param  {object} oPersistency An instance of the persistency object as interface to the database
 * @param  {object} oServiceOutput Output object of the request to set the reponse data and status code
 */
async function CalculationVersionSaveHandler($, oCalculationVersion, oCalculationVersionService, oPersistency, oServiceOutput, bOmitItems) {

    const aProtectedColumnsSave = [
        'SESSION_ID',
        'CALCULATION_ID',
        'CALCULATION_VERSION_TYPE',
        'STATUS_ID',
        'ROOT_ITEM_ID',
        'CUSTOMER_ID',
        'SALES_PRICE',
        'SALES_PRICE_CURRENCY_ID',
        'REPORT_CURRENCY_ID',
        'COSTING_SHEET_ID',
        'COMPONENT_SPLIT_ID',
        'SALES_DOCUMENT',
        'START_OF_PRODUCTION',
        'END_OF_PRODUCTION',
        'VALUATION_DATE',
        'LAST_MODIFIED_ON',
        'LAST_MODIFIED_BY',
        'MASTER_DATA_TIMESTAMP',
        'EXCHANGE_RATE_TYPE_ID',
        'MATERIAL_PRICE_STRATEGY_ID',
        'ACTIVITY_PRICE_STRATEGY_ID'
    ];
    const sSessionId = $.getPlcUsername();
    const iCalcId = oCalculationVersion.CALCULATION_ID;
    const sCalcVersionName = oCalculationVersion.CALCULATION_VERSION_NAME;
    // no const since it need to be reset for save-as
    var iCalcVersionId = oCalculationVersion.CALCULATION_VERSION_ID;

    // these fields are used to tracked which functions are already called for an instance of this handler in order to enforce the protocol 
    // of the save operations
    var bSaveChecked = false;
    var bSavePrepared = false;
    var bSaveAsChecked = false;
    var bSaveAsPrepared = false;

    // array to track ids of dirty items; filled by prepareSave in order to be able to only to put only modified items in the response 
    // of save and optimize the response size
    var aDirtyItems = null;
    // contains the current data base state of the calculation version; set by checkSaveAs and used also by prepareSaveAs; decacled as member
    // of the object to prevent db query
    var oDbCalculationVersion = null;

    /**	
	 * Locally defined function which performs checks common for save and save-as. It is intentionally not available from the interface of the object
	 * in order to not have clients to deal with it. 
	 */
    const _commonChecks = () => {
        if (!oPersistency.CalculationVersion.isOpenedInSessionAndContext(sSessionId, iCalcVersionId)) {
            const sClientMsg = 'Calculation version not opened.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_NOT_WRITABLE_ERROR, sClientMsg);
        }
    };

    /**	
	 * Checks if a save operation for the calculation version is possible (throws exception if not). Needs to be called first.
	 * @return {CalculationVersionSaveHandler} The current instance of the handler to enable method chaining
	 */
    this.checkSave = () => {
        _commonChecks();

        var oMessageDetails = new MessageDetails().addCalculationVersionObjs({
            name: sCalcVersionName,
            id: iCalcVersionId
        });

        // Check if the version is opened and locked.
        await oCalculationVersionService.isOpenedAndLockedInSession(oPersistency, sSessionId, iCalcVersionId, oMessageDetails);

        await oCalculationVersionService.checkIsVersionFrozen(oPersistency, iCalcVersionId);

        await oCalculationVersionService.isNameUnique(oPersistency, iCalcId, iCalcVersionId, sCalcVersionName, oMessageDetails);

        bSaveChecked = true;
        return this;
    };





    this.prepareSave = () => {
        if (!bSaveChecked) {
            const sLogMessage = `checkSave must be called before calling prepareSave.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        aDirtyItems = oPersistency.Item.getIdsOfDirtyItems(sSessionId, oCalculationVersion.CALCULATION_VERSION_ID);
        var oMessageDetails = new MessageDetails().addCalculationVersionObjs({
            name: sCalcVersionName,
            id: iCalcVersionId
        });

        if (!oPersistency.CalculationVersion.exists(iCalcVersionId)) {

            await oCalculationVersionService.checkIfCalculationExists(oPersistency, iCalcId, oMessageDetails);

            await oPersistency.CalculationVersion.update(oCalculationVersion, aProtectedColumnsSave, sSessionId);
        }

        oPersistency.CalculationVersion.setLifecycleVersionTypeToManual(oCalculationVersion, sSessionId);



        var aMasterVersions = oPersistency.CalculationVersion.getMasterVersions(iCalcVersionId);
        if (aMasterVersions.length > 0) {
            const sClientMsg = 'Calculation version cannot be saved, because it is used as source version.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_IS_SOURCE_VERSION_ERROR, sClientMsg);
        }

        bSavePrepared = true;
        return this;
    };





    this.checkSaveAs = () => {
        _commonChecks();


        if (!oPersistency.CalculationVersion.doesNameNotExist(iCalcId, sCalcVersionName)) {
            const sClientMsg = 'Error during saving the calculation version: name already exists.';
            const sServerMsg = `${ sClientMsg } Calculation version id: ${ iCalcVersionId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.CALCULATIONVERSION_NAME_NOT_UNIQUE_ERROR, sClientMsg);
        }


        oDbCalculationVersion = oPersistency.CalculationVersion.getWithoutItems([iCalcVersionId], sSessionId)[0];
        if (oDbCalculationVersion.CALCULATION_ID !== iCalcId) {
            const sClientMsg = 'Calculation Id must not be changed on save-as of a calculation version.';
            const sServerMsg = `${ sClientMsg } Original Id: ${ oDbCalculationVersion.CALCULATION_ID }, provided new Id: ${ iCalcId }.`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sClientMsg);
        }
        bSaveAsChecked = true;
        return this;
    };





    this.prepareSaveAs = () => {
        if (!bSaveAsChecked) {
            const sLogMessage = 'checkSaveAs must be called before calling prepareSaveAs.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }


        oCalculationVersion.IS_FROZEN = 0;


        var aProtectedColumnsSaveAs = aProtectedColumnsSave;
        aProtectedColumnsSaveAs = oPersistency.CalculationVersion.setLifecycleVersionPropertiesToBaseProperties(oCalculationVersion, oDbCalculationVersion, aProtectedColumnsSaveAs, sSessionId);



        const iCalculationVersionType = oPersistency.CalculationVersion.getVersionType(oCalculationVersion.CALCULATION_VERSION_ID);
        const bIsVariantBaseVersion = iCalculationVersionType === Constants.CalculationVersionType.GeneratedFromVariant;
        const bIsGeneratedFromVariantVersion = iCalculationVersionType === Constants.CalculationVersionType.VariantBase;

        if (bIsVariantBaseVersion === true || bIsGeneratedFromVariantVersion === true) {
            oCalculationVersion.CALCULATION_VERSION_TYPE = Constants.CalculationVersionType.Base;
            aProtectedColumnsSaveAs = _.difference(aProtectedColumnsSaveAs, ['CALCULATION_VERSION_TYPE']);
        }

        await oPersistency.CalculationVersion.update(oCalculationVersion, aProtectedColumnsSaveAs, sSessionId);


        iCalcVersionId = oPersistency.CalculationVersion.setNewId(iCalcVersionId, sSessionId);

        bSaveAsPrepared = true;
        return this;
    };





    this.execute = () => {
        if (!bSaveAsPrepared && !bSavePrepared) {
            const sLogMessage = `Either prepareSave or bSavePrepared must be called before calling execute.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        oPersistency.Item.deleteItems(sSessionId, iCalcVersionId);
        oPersistency.CalculationVersion.saveCalculationResults(iCalcVersionId, sSessionId);
        await oPersistency.CalculationVersion.save(iCalcVersionId, sSessionId, sSessionId);

        let oCvRelevantFields = oPersistency.CalculationVersion.getSaveRelevantFields(sSessionId, iCalcVersionId);


        let aItemsRelevantFields = oPersistency.Item.getSaveRelevantFields(aDirtyItems, sSessionId, iCalcVersionId);
        var oOutput = await oCalculationVersionService.prepareOutput({
            version: oCvRelevantFields,
            items: aItemsRelevantFields
        }, bOmitItems);






        const aCopiedVariantsToSave = await oPersistency.Variant.getCopiedVariants(iCalcVersionId);
        if (aCopiedVariantsToSave.length > 0) {
            const aValidCopiedVariants = aCopiedVariantsToSave.map(oCopiedVariant => {
                const oValidCopiedVariant = _.clone(oCopiedVariant);
                oValidCopiedVariant.LAST_MODIFIED_ON = oOutput.LAST_MODIFIED_ON;
                oValidCopiedVariant.LAST_REMOVED_MARKINGS_ON = oOutput.LAST_MODIFIED_ON;
                return oValidCopiedVariant;
            });
            await oPersistency.Variant.update(aValidCopiedVariants, aCopiedVariantsToSave, iCalcVersionId);
        }
        oOutput[MetaInformation.IsDirty] = 0;
        oOutput[MetaInformation.IsWritable] = 1;
        oServiceOutput.setTransactionalData(oOutput);
    };
}
CalculationVersionSaveHandler.prototype = await Object.create(CalculationVersionSaveHandler.prototype);
CalculationVersionSaveHandler.prototype.constructor = CalculationVersionSaveHandler;

module.exports.CalculationVersionSaveHandler = CalculationVersionSaveHandler;
export default {_,Constants,MetaInformation,MessageLibrary,PlcException,Code,MessageDetails,CalculationVersionSaveHandler};
