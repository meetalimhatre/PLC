const BusinessObjectTypes = $.require('../util/constants').BusinessObjectTypes;
const BusinessObjectValidatorUtils = $.require('./businessObjectValidatorUtils').BusinessObjectValidatorUtils;
const MetadataProvider = $.require('../metadata/metadataProvider').MetadataProvider;


let imps = {};

// lazy load validator .xsjslib/.js
let importValidator = function (libfilename, objectname) {
    Object.defineProperty(imps, objectname, {
        get: async function () {

            return await (async () => {
                let _objectname = '_' + objectname;
                if (!(_objectname in this)) {
                    if (libfilename.endsWith('.js')) {
                        this[_objectname] = $.require('./' + libfilename)[objectname];
                    } else {
                        this[_objectname] = $.import('xs.validator', libfilename)[objectname];
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
            return new BusinessObjectValidatorUtils(sObjectType);
        };
        let getMetadataProvider = async function () {
            return new MetadataProvider();
        };

        switch (sObjectType) {
        case BusinessObjectTypes.Auth:
        case BusinessObjectTypes.PlcExtensionsGreet:
            return new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.ApplicationData:
            return new imps.BodilessRequestValidator([$.net.http.GET]);
        case BusinessObjectTypes.InitSession:
            return new imps.BodilessRequestValidator([$.net.http.POST]);
        case BusinessObjectTypes.Logout:
            return new imps.BodilessRequestValidator([$.net.http.POST]);
        case BusinessObjectTypes.Ping:
            return new imps.BodilessRequestValidator([$.net.http.GET]);
        case BusinessObjectTypes.Addin:
            return new imps.AddinValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.AddinConfiguration:
            return new imps.AddinConfigurationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Calculation:
            return new imps.CalculationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculatedResults:
            return new imps.CalculatedResultsValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculationVersion:
            return new imps.CalculationVersionValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.CalculationVersionRecover:
            return new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Item:
            return new imps.ItemValidator($, oPersistency, sSessionId, $.getPlcUsername(), getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Customfieldsformula:
            return new imps.CustomfieldsformulaValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Project:
            return new imps.ProjectValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.ProjectActivityPriceSurcharges:
            return new imps.ProjectActivityPriceSurchargesValidator(oPersistency, getUtils());
        case BusinessObjectTypes.ProjectMaterialPriceSurcharges:
            return new imps.ProjectMaterialPriceSurchargesValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Administration:
            return new imps.AdministrationValidator(oPersistency, sSessionId, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.DefaultSettings:
            return new imps.DefaultSettingsValidator(getUtils());
        case BusinessObjectTypes.Lock:
            return new imps.DummyValidator([$.net.http.DEL]);
        case BusinessObjectTypes.GlobalSearch:
            return new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Transportation:
            return new imps.TransportationValidator(oPersistency, sSessionId, getUtils());
        case BusinessObjectTypes.Layout:
            return new imps.LayoutValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Task:
            return new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.Privilege:
            return new imps.PrivilegeValidator(oPersistency, getUtils());
        case BusinessObjectTypes.Group:
            return new imps.GroupValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.PlcUsers:
            return new imps.DummyValidator([$.net.http.GET]);
        case BusinessObjectTypes.FrontendSettings:
            return new imps.FrontendSettingsValidator(oPersistency, getUtils());
        case BusinessObjectTypes.DataProtection:
            return new imps.DataProtectionValidator(getUtils());
        case BusinessObjectTypes.RetentionPeriods:
            return new imps.RetentionPeriodsValidator($, getUtils());
        case BusinessObjectTypes.Variant:
            return new imps.VariantValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.Masterdata:
            return new imps.MasterdataValidator(oPersistency, getUtils());
        case BusinessObjectTypes.SimilarPartsSearch:
            return new imps.SimilarPartsSearchValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.VariantCalculator:
            return new imps.VariantCalculatorValidator(oPersistency, getMetadataProvider(), getUtils());
        case BusinessObjectTypes.VariantGenerator:
            return new imps.VariantGeneratorValidator(oPersistency, getMetadataProvider(), getUtils());
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
