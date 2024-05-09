const TenancyConnection = $.require('../../ops/util/tenantUtil-cf');

/*
* check CF or XSA and get connection 
* @returns hdb connection
*/
async function getConnection(oOption, sTenantID) {
    let oHanaOption = oOption || { 'treatDateAsUTC': true };
    let iTenantID = sTenantID || (await processParameters($.request)).tenantid;
    if (!iTenantID) {
        throw Error('Invalid request on CF without tenant ID');
    }
    return await TenancyConnection.getConnectionByTenantID(iTenantID, oHanaOption);
}

function processParameters(request) {
    const params = request.parameters;
    const oParam = {};
    for (let i = 0; i < params.length; i++) {
        oParam[params[i].name] = params[i].name === 'optional' ? JSON.parse(params[i].value) : params[i].value;
    }
    return oParam;
}
export default {TenancyConnection,getConnection,processParameters};
