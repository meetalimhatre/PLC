var helpers = $.require("../../../lib/xs/util/helpers");
var MessageLibrary = $.require("../../../lib/xs/util/message");
var PlcException = MessageLibrary.PlcException;
var InvalidRequestException = $.require("../../../lib/xs/xslib/exceptions").InvalidRequestException;

var Tables = Object.freeze({
	calculation_version_temporary : 'sap.plc.db::basis.t_calculation_version_temporary',
	calculation_version : 'sap.plc.db::basis.t_calculation_version',
	open_calculation_versions : 'sap.plc.db::basis.t_open_calculation_versions'
});


function handleRequest(oRequest, oResponse, sSessionId, sUserId) {

    switch (oRequest.method) {
        case $.net.http.DEL:
            return handleDeleteRequest(oRequest, oResponse, sSessionId, sUserId);
        default:
            throw new InvalidRequestException("Request method not allowed", $.net.http.METHOD_NOT_ALLOWED);
    }

    function handleDeleteRequest() {

        try {
            var sResponseMessage;            
            
            var sUnfreezeMode = oRequest.queryPath.split('/')[0];
            var sUnfreezeID = oRequest.queryPath.split('/')[1];
            
            if (!helpers.isPositiveInteger(sUnfreezeID)) {
                const developerInfo = sUnfreezeMode + " Id must be a positive number";
                $.trace.error(developerInfo);
                throw new PlcException(MessageLibrary.Code.GENERAL_UNEXPECTED_EXCEPTION, developerInfo, '', undefined, undefined);
            }
            
            switch(sUnfreezeMode) {
                case 'calcVersion':                    
                    var oUpdateCalcVers = hQuery.statement('update "' + Tables.calculation_version + '" set IS_FROZEN = 0 where calculation_version_id = ?');
                    oUpdateCalcVers.execute(sUnfreezeID);
                    
                    var oUpdateCalcVersTemp = hQuery.statement('update "' + Tables.calculation_version_temporary + '" set IS_FROZEN = 0 where calculation_version_id = ?');
                    oUpdateCalcVersTemp.execute(sUnfreezeID);
                    
                    var oUpdateOpenCalcVers = hQuery.statement('update "' + Tables.open_calculation_versions + '" set IS_WRITEABLE = 1 where calculation_version_id = ?');
                    oUpdateOpenCalcVers.execute(sUnfreezeID);
                
                    hQuery.getConnection().commit();
                    
                    sResponseMessage = "Frozen Flag has been removed for CalcVersion " + sUnfreezeID;
                    break;
                    
                default:
                    sResponseMessage = 'Mode not supported!';
            }
            
            //var sCalcID = helpers.toPositiveInteger(oRequest.queryPath);

    		// validate calculation version id
    		/*if (!sCalcID) {
    			throw new InvalidRequestException("calc id has to be defined in the queryPath");
    		}*/
            
            oResponse.setBody(sResponseMessage);

        } catch (e) {
            oResponse.setBody("Cleanup failed \n" + "Developer Info: " + e.developerMessage);
        }

    }

}