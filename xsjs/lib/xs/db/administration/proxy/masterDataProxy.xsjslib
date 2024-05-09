
var MasterDataObjectHandlerFactory 	= $.import("xs.db.administration.factory", "masterDataFactory").MasterDataObjectHandlerFactory;

function MasterDataObjectHandlerProxy(dbConnection, hQuery, sObjectName, sIgnoreBadData) {
	
	this.oBusinessObject = new MasterDataObjectHandlerFactory(dbConnection, hQuery).createBusinessObject(sObjectName, sIgnoreBadData);
	
	this.get= function(oGetParameters, sLanguage, sMasterDataDate) {
		return this.oBusinessObject.get(oGetParameters, sLanguage, sMasterDataDate);
	};

	this.processBatch= function() {
        return this.oBusinessObject.process();
	};

	this.validateBatch= function(oBatchItems, sMasterDataDate) {
        return this.oBusinessObject.validate(oBatchItems,sMasterDataDate);
    };
}
MasterDataObjectHandlerProxy.prototype = Object.create(MasterDataObjectHandlerProxy.prototype);
MasterDataObjectHandlerProxy.prototype.constructor = MasterDataObjectHandlerProxy;