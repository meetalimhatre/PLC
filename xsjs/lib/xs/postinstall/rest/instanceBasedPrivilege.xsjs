var oInstanceBasedPrivilege = await $.import('xs.postinstall.release_2_1_0', '02_grant_instance_based_privileges');
var oConnection = await $.hdb.getConnection();
await oConnection.setAutoCommit(true);
try {
    if ($.request.method === $.net.http.POST) {
        var sUserList = $.request.parameters[0].value;
        await oInstanceBasedPrivilege.update(oConnection, sUserList);
    }
    $.response.setBody({ 'message': 'successfully update users' });
} catch (e) {
    $.response.setBody({ 'message': e.message });
}
export default {oInstanceBasedPrivilege,oConnection};
