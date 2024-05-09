const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var trace = $.trace;
var traceHelper = $.import("xs.xslib", "traceHelper");
const exceptionsLib = $.require("../../../lib/xs/xslib/exceptions");
var DatabaseException = exceptionsLib.DatabaseException;
var InvalidRequestException = exceptionsLib.InvalidRequestException;
var helpers = $.require("../../../lib/xs/util/helpers");

function handleRequest(oRequest, oResponse, sSessionId, sUserId) {
   
        switch (oRequest.method) {
            case $.net.http.GET:
                return handleChangeIDRequest(oRequest, oResponse, sSessionId, sUserId);
               
            default:
                throw new InvalidRequestException("method not allowed", $.net.http.METHOD_NOT_ALLOWED);
        }
    

    function handleChangeIDRequest() {
        
    	if ('parameters' in oRequest) {
            if (oRequest.parameters.get("oldID") === undefined) {
                throw new InvalidRequestException("invalid parameter (oldID parameter missing)");
            }
            if (oRequest.parameters.get("newID") === undefined) {
                throw new InvalidRequestException("invalid parameter (newID parameter missing)");
            }
        };
    	
        var iOldId = helpers.toPositiveInteger(oRequest.parameters.get("oldID"));
        var iNewId = helpers.toPositiveInteger(oRequest.parameters.get("newID"));
        

        if(iOldId === 2809){
            oResponse.setBody("Finger weg von Calculation Version "+iOldId+". Die ändere ich nicht!");
            
        }else{

            // ======================================================
            // prepare cleanup procedure call
            // ======================================================
            try {
               var hQuery = hQueryLib.hQuery($.hdb.getConnection());
            
                var oCloseCalculationVersion = hQuery.procedure("sap.plc_test.testtools.DeleteCalculationHelper::p_change_calcversionid");
                oCloseCalculationVersion.execute({
                     OLDID : iOldId,
                     NEWID : iNewId
                });
                hQuery.getConnection().commit();
            
                oResponse.setBody("changed ID successfully calculation "+iNewId + "don't forget to close it :-)");
                
            } catch (e) {
                throw new DatabaseException(e.message);
                oResponse.setBody("changing ID failed");
            }
        }
    }
    //senseless return, however needed because JSLint does recognize the inner function as potential branch :'(
    return undefined;

}

