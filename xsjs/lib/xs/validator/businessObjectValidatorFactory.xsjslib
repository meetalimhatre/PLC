const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;
const BusinessObjectValidatorUtils = $.require('./businessObjectValidatorUtils').BusinessObjectValidatorUtils;
const MetadataProvider = $.require('../metadata/metadataProvider').MetadataProvider;


let imps = {};

// lazy load validator .xsjslib/.js
let importValidator = function (libfilename, objectname) {
    Object.defineProperty(imps, objectname, {
        get: function () {
            return (() => {
                let _objectname = '_' + objectname;
                if (!(_objectname in this)) {
                    if (libfilename.endsWith('.js')) {
                        this[_objectname] = $.require('./' + libfilename)[objectname];
                    } else {
                        this[_objectname] = await $.import('xs.validator', libfilename)[objectname];
                    }
                }
                return this[_objectname];
            })();
        }
    });
};

importValidator('itemValidator.js', 'ItemValidator');
importValidator('bodilessRequestValidator.js', 'BodilessRequestValidator');
importValidator('dummyValidator.js', 'DummyValidator');
importValidator('addinValidator', 'AddinValidator');
importValidator('addinConfigurationValidator', 'AddinConfigurationValidator');
importValidator('administrationValidator', 'AdministrationValidator');
importValidator('calculationValidator', 'CalculationValidator');
importValidator('calculatedResultsValidator', 'CalculatedResultsValidator');
importValidator('calculationVersionValidator', 'CalculationVersionValidator');
importValidator('customfieldsformulaValidator', 'CustomfieldsformulaValidator');
importValidator('projectValidator', 'ProjectValidator');
importValidator('projectActivityPriceSurchargesValidator', 'ProjectActivityPriceSurchargesValidator');
importValidator('projectMaterialPriceSurchargesValidator', 'ProjectMaterialPriceSurchargesValidator');
importValidator('variantValidator', 'VariantValidator');
importValidator('masterdataValidator', 'MasterdataValidator');
importValidator('defaultSettingsValidator', 'DefaultSettingsValidator');
importValidator('transportationValidator', 'TransportationValidator');
importValidator('layoutValidator', 'LayoutValidator');
importValidator('privilegeValidator', 'PrivilegeValidator');
importValidator('groupValidator', 'GroupValidator');
importValidator('frontendSettingsValidator', 'FrontendSettingsValidator');
importValidator('similarPartsSearchValidator', 'SimilarPartsSearchValidator');
importValidator('dataProtectionValidator', 'DataProtectionValidator');
importValidator('retentionPeriodsValidator.js', 'RetentionPeriodsValidator');
importValidator('variantCalculatorValidator', 'VariantCalculatorValidator');
importValidator('variantGeneratorValidator', 'VariantGeneratorValidator');


// TODO: think about "static" methods on the factory object here...Should be sufficient,
// but is in contrast to the handling of the other validator classes
/**
 * Static factory object that provides a function to create a BusinessObjectValidator based on a given sObjectType
 */
var BusinessObjectValidatorFactory = Object.freeze({
    async createBusinessObjectValidator(sObjectType, oPersistency, sSessionId) {
        let getUtils = async function () {
            return await new BusinessObjectValidatorUtils(sObjectType);
        };
        let getMetadataProvider = async function () {
            return await new MetadataProvider();
        };

        switch (sObjectType) {
        case BusinessObjectTypes.Auth:
        case BusinessObjectTypes.PlcExtensionsGreet:
            return await new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.ApplicationData:
            return await new imps.BodilessRequestValidator([$.net.http.GET]);
        case BusinessObjectTypes.InitSession:
            return await new imps.BodilessRequestValidator([$.net.http.POST]);
        case BusinessObjectTypes.Logout:
            return await new imps.BodilessRequestValidator([$.net.http.POST]);
        case BusinessObjectTypes.Ping:
            return await new imps.BodilessRequestValidator([$.net.http.GET]);
        case BusinessObjectTypes.Addin:
            return await new imps.AddinValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.AddinConfiguration:
            return await new imps.AddinConfigurationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Calculation:
            return await new imps.CalculationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculatedResults:
            return await new imps.CalculatedResultsValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculationVersion:
            return await new imps.CalculationVersionValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculationVersionRecover:
            return await new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Item:
            return await new imps.ItemValidator($, oPersistency, sSessionId, $.getPlcUsername(), getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Customfieldsformula:
            return await new imps.CustomfieldsformulaValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Project:
            return await new imps.ProjectValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.ProjectActivityPriceSurcharges:
            return await new imps.ProjectActivityPriceSurchargesValidator(oPersistency, getUtils());
        case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
            return await new imps.ProjectMaterialPriceSurchargesValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Administration:
            return await new imps.AdministrationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.DefaultSettings:
            return await new imps.DefaultSettingsValidator(getUtils());
        case BusinessObjectTypes.Lock:
            return await new imps.DummyValidator([$.net.http.DEL]);
        case BusinessObjectTypes.GlobalSearch:
            return await new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Transportation:
            return await new imps.TransportationValidator(oPersistency, sSessionId, getUtils());
        case BusinessObjectTypes.Layout:
            return await new imps.LayoutValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Task:
            return await new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Privilege:
            return await new imps.PrivilegeValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Group:
            return await new imps.GroupValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.PlcUsers:
            return await new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.FrontendSettings:
            return await new imps.FrontendSettingsValidator(oPersistency, getUtils());
        case BusinessObjectTypes.DataProtection:
            return await new imps.DataProtectionValidator(getUtils());
        case BusinessObjectTypes.RetentionPeriods:
            return await new imps.RetentionPeriodsValidator($, getUtils());
        case BusinessObjectTypes.Variant:
            return await new imps.VariantValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Masterdata:
            return await new imps.MasterdataValidator(oPersistency, getUtils());
        case BusinessObjectTypes.SimilarPartsSearch:
            return await new imps.SimilarPartsSearchValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.VariantCalculator:
            return await new imps.VariantCalculatorValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.VariantGenerator:
            return await new imps.VariantGeneratorValidator(oPersistency, getMetadataProvider(), getUtils());
        default: {
                const sLogMessage = `Cannot create BusinessObjectValidator object for sObjectType ${ sObjectType }.`;
                $.trace.error(sLogMessage);

                const MessageLibrary = $.require('../util/message');
                const PlcException = MessageLibrary.PlcException;
                const Code = MessageLibrary.Code;
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    }
});
export default {BusinessObjectTypes,BusinessObjectValidatorUtils,MetadataProvider,imps,importValidator,BusinessObjectValidatorFactory};
