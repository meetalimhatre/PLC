var MasterDataObjectHandlerFactory = $.import('xs.db.administration.factory', 'masterDataFactory').MasterDataObjectHandlerFactory;

async function MasterDataObjectHandlerProxy(dbConnection, hQuery, sObjectName, sIgnoreBadData) {

    this.oBusinessObject = (await new MasterDataObjectHandlerFactory(dbConnection, hQuery)).createBusinessObject(sObjectName, sIgnoreBadData);

    this.get = async function (oGetParameters, sLanguage, sMasterDataDate) {
        return this.oBusinessObject.get(oGetParameters, sLanguage, sMasterDataDate);
    };

    this.processBatch = function () {
        return this.oBusinessObject.process();
    };

    this.validateBatch = async function (oBatchItems, sMasterDataDate) {
        return await this.oBusinessObject.validate(oBatchItems, sMasterDataDate);
    };
}
MasterDataObjectHandlerProxy.prototype = await Object.create(MasterDataObjectHandlerProxy.prototype);
MasterDataObjectHandlerProxy.prototype.constructor = MasterDataObjectHandlerProxy;
export default {MasterDataObjectHandlerFactory,MasterDataObjectHandlerProxy};
