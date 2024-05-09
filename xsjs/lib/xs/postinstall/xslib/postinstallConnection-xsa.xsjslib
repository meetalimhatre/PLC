/*
* check CF or XSA and get connection 
* @returns hdb connection
*/
function getConnection(oOption) {
    let oHanaOption = oOption || {"treatDateAsUTC" : true};
    return $.hdb.getConnection(oHanaOption);
}