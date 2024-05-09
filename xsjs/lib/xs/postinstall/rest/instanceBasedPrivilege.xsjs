var oInstanceBasedPrivilege = $.import("xs.postinstall.release_2_1_0", "02_grant_instance_based_privileges");
var oConnection = $.hdb.getConnection();
oConnection.setAutoCommit(true);
try{
    if ($.request.method === $.net.http.POST) { 
        var sUserList = $.request.parameters[0].value;
        oInstanceBasedPrivilege.update(oConnection, sUserList);
    }
    $.response.setBody({
        "message": "successfully update users" 
    });
} catch(e) {
    $.response.setBody({
        "message": e.message
    });
}
