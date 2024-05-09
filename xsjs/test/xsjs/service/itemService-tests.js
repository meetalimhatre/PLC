var itemService = require("../../../lib/xs/service/itemService");
var MessageLibrary = require("../../../lib/xs/util/message");
var ServiceOutput = require("../../../lib/xs/util/serviceOutput");

describe('xsjs.service.itemService-tests', function(){
    
    var oCode = MessageLibrary.Code.PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING.code;
    var sSeverity = MessageLibrary.Severity.INFO;
    var oDetails = "Some Details.";
    var sOperation = MessageLibrary.Operation.CREATE;
    
    it('should process all value determination messages if there are less than 10', function(){
        //arrange
        var oServiceOutput = new ServiceOutput();
        var aMessages = [];
        for (var i = 0; i < 5; i++) { 
            var oMessage =  new MessageLibrary.Message(oCode, sSeverity, oDetails, sOperation);
            oMessage.ITEM_ID = 1000;
            oMessage.MSG_ID=oCode;
            aMessages.push(oMessage);
        }
        
        //act
        var result = itemService.processValueDeterminationMessages(aMessages,oServiceOutput);
        
        //assert
        expect(result).toBeDefined();
        expect(result.length).toEqual(0);
        expect(oServiceOutput.payload.head.messages).toBeDefined();
        expect(oServiceOutput.payload.head.messages.length).toEqual(5);
    });
    
    it('should not process more than 10 value determination messages', function(){
        //arrange
        var oServiceOutput = new ServiceOutput();
        var aMessages = [];
        for (var i = 0; i < 15; i++) { 
            var oMessage =  new MessageLibrary.Message(oCode, sSeverity, oDetails, sOperation);
            oMessage.ITEM_ID = 1000;
            oMessage.MSG_ID=oCode;
            aMessages.push(oMessage);
        }
        
        //act
        var result = itemService.processValueDeterminationMessages(aMessages,oServiceOutput);
        
        //assert
        expect(result).toBeDefined();
        expect(result.length).toEqual(0);
        expect(oServiceOutput.payload.head.messages).toBeDefined();
        expect(oServiceOutput.payload.head.messages.length).toEqual(10);
    });
    
    it('should return successfully if there are no messages to processes', function(){
        //arrange
        var oServiceOutput = new ServiceOutput();
        
        //act
        var result = itemService.processValueDeterminationMessages(undefined,oServiceOutput);
        
        //assert
        expect(result).toBeDefined();
        expect(result.length).toEqual(0);
    });
    
}).addTags(["All_Unit_Tests"]);
