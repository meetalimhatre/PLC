const task = $.import("xs.postinstall.xslib", "task");
const info = $.import("xs.postinstall.xslib", "installationInfo");
const driver = $.import("xs.postinstall.xslib", "driver");
const sPlatformConnection = $.require("../../../platform/platformSpecificImports.js").getPostinstallConnection().postInstallConnection;
const oPrivileges = Object.freeze({
    admin: "Admin"
});
const dbConnection = $.import(sPlatformConnection.substr(0, sPlatformConnection.lastIndexOf(".")), sPlatformConnection.substr(sPlatformConnection.lastIndexOf(".") + 1)).getConnection();
dbConnection.setAutoCommit(true);

/* Post-Install request dispatch
 * For get request:
 *   - If no parameters, redirect to UI interface
 *   - If parameter info equals env, return post install information
 *   - If parameter info equals task, return task status
 * For post request:
 *  - Execute register installation
**/
function run(request, response) {

    if (!checkPostinstallPrivilege()) {
        response.status = $.net.http.FORBIDDEN;
        response.setBody("the current user doesn't have the scope to invoke Post-Install service");
        return;
    }
    $.getPlcUsername = () => ($.session.getUsername() || 'TECHNICAL_USER');
    if (request.method === $.net.http.GET) {
        if (Object.keys(request.parameters).length === 0) {
            redirect();
        } else if (request.parameters.get("info") === 'check') {
            info.checkPreviousInstallationRun(response, dbConnection);
        } else if (request.parameters.get("info") === 'env') {
            info.postInstallationInfo(request, response, dbConnection);
        } else if (request.parameters.get("info") === 'task') {
            task.taskInfo(request, response);
        } else if (request.parameters.get("scenario") === 'cli') {
            driver.run(request, response, true, dbConnection);
        }
    } else if (request.method === $.net.http.POST) {
        // The third parameter means if using $.rsponse.followUp to excute registers

        driver.run(request, response, true, dbConnection);
    }
}

function checkPostinstallPrivilege() {
    return $.session.hasAppPrivilege(oPrivileges.admin)
}

function redirect() {
    $.response.contentType = "html/text";
    $.response.status = $.net.http.MOVED_PERMANENTLY;
    $.response.headers.set("location", "/admin/tools/index.html");
}
