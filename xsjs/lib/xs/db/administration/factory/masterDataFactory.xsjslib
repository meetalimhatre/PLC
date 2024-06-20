var BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;

let imps = {};
// lazy load xsjslib files in factory
let lazyImport = function (libfilename, objectname) {
    Object.defineProperty(imps, objectname, {
        get: function () {
            return  ( () => {
                let _objectname = '_' + objectname;
                if (!(_objectname in this)) {
                    this[_objectname] = $.import('xs.db.administration.factory', libfilename)[objectname];
                }
                return this[_objectname];
            })();
        }
    });
};

lazyImport('masterDataBaseObject', 'MasterDataBaseObject');
lazyImport('account', 'Account');
lazyImport('activityPrice', 'ActivityPrice');
lazyImport('activityType', 'ActivityType');
lazyImport('businessArea', 'BusinessArea');
lazyImport('process', 'Process');
lazyImport('companyCode', 'CompanyCode');
lazyImport('confidenceLevel', 'ConfidenceLevel');
lazyImport('costCenter', 'CostCenter');
lazyImport('controllingArea', 'ControllingArea');
lazyImport('currency', 'Currency');
lazyImport('currencyConversion', 'CurrencyConversion');
lazyImport('customer', 'Customer');
lazyImport('dimension', 'Dimension');
lazyImport('document', 'Document');
lazyImport('documentStatus', 'DocumentStatus');
lazyImport('documentType', 'DocumentType');
lazyImport('designOffice', 'DesignOffice');
lazyImport('language', 'Language');
lazyImport('material', 'Material');
lazyImport('materialAccountDetermination', 'MaterialAccountDetermination');
lazyImport('materialGroup', 'MaterialGroup');
lazyImport('materialPlant', 'MaterialPlant');
lazyImport('materialPrice', 'MaterialPrice');
lazyImport('materialType', 'MaterialType');
lazyImport('overheadGroup', 'OverheadGroup');
lazyImport('plant', 'Plant');
lazyImport('profitCenter', 'ProfitCenter');
lazyImport('unitOfMeasure', 'UnitOfMeasure');
lazyImport('valuationClass', 'ValuationClass');
lazyImport('vendor', 'Vendor');
lazyImport('workCenter', 'WorkCenter');


function MasterDataObjectHandlerFactory(dbConnection, hQuery) {

    this.createBusinessObject = function (sObjectName, sIgnoreBadData) {
        switch (sObjectName) {
        case BusinessObjectTypes.Account:
            return  new imps.Account(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ActivityPrice:
            return new imps.ActivityPrice(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ActivityType:
            return  new imps.ActivityType(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.BusinessArea:
            return  new imps.BusinessArea(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Process:
            return  new imps.Process(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.CompanyCode:
            return  new imps.CompanyCode(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ConfidenceLevel:
            return  new imps.ConfidenceLevel(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ControllingArea:
            return  new imps.ControllingArea(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.CostCenter:
            return  new imps.CostCenter(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.CurrencyConversion:
            return  new imps.CurrencyConversion(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Currency:
            return  new imps.Currency(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Customer:
            return  new imps.Customer(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Dimension:
            return  new imps.Dimension(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Document:
            return  new imps.Document(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.DocumentStatus:
            return  new imps.DocumentStatus(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.DocumentType:
            return  new imps.DocumentType(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.DesignOffice:
            return  new imps.DesignOffice(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Language:
            return  new imps.Language(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Material:
            return  new imps.Material(dbConnection, hQuery, sObjectName, sIgnoreBadData, sIgnoreBadData);
        case BusinessObjectTypes.MaterialAccountDetermination:
            return  new imps.MaterialAccountDetermination(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.MaterialGroup:
            return  new imps.MaterialGroup(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.MaterialPlant:
            return  new imps.MaterialPlant(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.MaterialPrice:
            return new imps.MaterialPrice(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.MaterialType:
            return  new imps.MaterialType(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.OverheadGroup:
            return  new imps.OverheadGroup(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Plant:
            return  new imps.Plant(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ProfitCenter:
            return  new imps.ProfitCenter(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.UnitOfMeasure:
            return  new imps.UnitOfMeasure(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.ValuationClass:
            return  new imps.ValuationClass(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.Vendor:
            return  new imps.Vendor(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        case BusinessObjectTypes.WorkCenter:
            return  new imps.WorkCenter(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        default:
            return  new imps.MasterDataBaseObject(dbConnection, hQuery, sObjectName, sIgnoreBadData);
        }
    };
}

MasterDataObjectHandlerFactory.prototype = Object.create(MasterDataObjectHandlerFactory.prototype);
MasterDataObjectHandlerFactory.prototype.constructor = MasterDataObjectHandlerFactory;
export default {BusinessObjectTypes,imps,lazyImport,MasterDataObjectHandlerFactory};
