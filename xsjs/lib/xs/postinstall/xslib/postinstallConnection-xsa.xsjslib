/*
* check CF or XSA and get connection 
* @returns hdb connection
*/
async function getConnection(oOption) {
    let oHanaOption = oOption || { 'treatDateAsUTC': true };
    return await $.hdb.getConnection(oHanaOption);
}
export default {getConnection};
