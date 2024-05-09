//This script sets the log of PLC to a version given via parameter. This can be used to run the postinstall-tool multiple times.

function validateParameters(oRequest){
    var sVersion = oRequest.parameters.get('resetToVersion');
    if (sVersion === undefined) {
    		return false;
    }
    var pattern = /^[1-9]+\.[0-9]+\.[0-9]+$/;
    if(!sVersion.match(pattern)){
        return false;
    }
    return true;
}

function deletePostInstallSteps(sVersion, oConnection){
    var aVersionNumbers =[];
    var pattern = /[0-9]+/g;
    var match;
    while ((match = pattern.exec(sVersion))!==null) {
        aVersionNumbers.push(match[0]);
    }
    
    var iVersion = aVersionNumbers[0]; 
    var iServicePack = aVersionNumbers[1];
    var iPatch = aVersionNumbers[2];
    
    oConnection.executeUpdate(`delete from "sap.plc.db::basis.t_installation_log" 
        where 
            VERSION > ${iVersion} or
            (VERSION = ${iVersion} and VERSION_SP > ${iServicePack}) or
            (VERSION = ${iVersion} and VERSION_SP = ${iServicePack} and VERSION_PATCH >${iPatch})
    `);
    
     oConnection.executeUpdate(`update "sap.plc.db::basis.t_initialization_state" set 
        PLC_VERSION = '${sVersion}'
    `);
    return true;
}

if($.request.method === $.net.http.GET) {
   var oConnection = $.hdb.getConnection();
   var result;
   if(validateParameters($.request)){
        //delete postinstallsteps
        deletePostInstallSteps( $.request.parameters.get('resetToVersion'),oConnection)
        result = `Successfully reverted Postinstalltool to version ${$.request.parameters.get('resetToVersion')}`;
        
    }else{
       result = `Invalid parameter. Please provide "resetToVersion" parameter (Format: ^[1-9]+\.[0-9]+\.[0-9]+$)`;
   }
   
   oConnection.commit();
   
   // send response
   $.response.contentType = "text/plain";
   $.response.setBody(result);
   $.response.status = $.net.http.OK;
} else {
   // unsupported method
   $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
}