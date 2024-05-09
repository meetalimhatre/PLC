const hQueryLib = $.require("../../../lib/xs/xslib/hQuery");
var trace = $.trace;
var traceHelper = $.import("xs.xslib", "traceHelper");
const exceptionsLib = $.require("../../../lib/xs/xslib/exceptions");
var DatabaseException = exceptionsLib.DatabaseException;
var InvalidRequestException = exceptionsLib.InvalidRequestException;
var helpers = $.require("../../../lib/xs/util/helpers");

function handleRequest(oRequest, oResponse, sSessionId, sUserId, oHq) {
   
        switch (oRequest.method) {
            case $.net.http.DEL:
                return handleDeleteRequest(oRequest, oResponse, sSessionId, sUserId);
               
            default:
                throw new InvalidRequestException("method not allowed", $.net.http.METHOD_NOT_ALLOWED);
        }
    

    function handleDeleteRequest() {
        
        var sCalcID = helpers.toPositiveInteger(oRequest.queryPath);

        if(sCalcID === 2809){
            oResponse.setBody("Finger weg von Calculation Version "+sCalcID+". Die lösche ich nicht! Dann schimpft Marcel!");
            
        }else{
        
            // validate calculation version id
            if (!sCalcID) {
                throw new InvalidRequestException("calc id has to be defined in the queryPath");
            }
    
            // ======================================================
            // prepare cleanup procedure call
            // ======================================================
            try {
                var hQuery = hQueryLib.hQuery($.hdb.getConnection());
            
                var actionParameter = getActionParameters();
                var sResponseMessage;
                
                if(actionParameter === 'deleteAll'){
                	var oCloseCalculationVersion = hQuery.procedure("sap.plc_test.testtools.DeleteCalculationHelper::p_delete_all_versions_with_id_greater_than");
                	oCloseCalculationVersion.execute({
                     "CALCVERSIONID": sCalcID
                	});
                	sResponseMessage = "Deleted successfully all calculation versions with ID greater than"+sCalcID;
                }else{
                
                	var oCloseCalculationVersion = hQuery.procedure("sap.plc_test.testtools.DeleteCalculationHelper::p_calculation_version_delete");
                	oCloseCalculationVersion.execute({
                     "CALCVERSIONID": sCalcID
                	});
                	sResponseMessage = "Deleted successfully calculation "+sCalcID;
                }
                
                hQuery.getConnection().commit();
                oResponse.setBody(sResponseMessage);
                
            } catch (e) {
                throw new DatabaseException(e.message);
                oResponse.setBody("Delete failed");
            }
        }

    }
    
    
    /**
     *  Checks if the "action" parameter is set in the request object and returns its value.
     *  @returns {string} value of the "action" parameter or undefined if not set
     */
    function getActionParameters() {
        //check if parameters are there and correct ("action")
        if ('parameters' in oRequest) {
            return oRequest.parameters.get("action");
        };
        return undefined;
    }
    
    
    //senseless return, however needed because JSLint does recognize the inner function as potential branch :'(
    return undefined;

}

