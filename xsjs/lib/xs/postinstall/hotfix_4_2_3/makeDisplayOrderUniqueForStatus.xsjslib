const helpers = $.require("../../util/helpers");
const sStatusTableName = "sap.plc.db::basis.t_status";
var oConnection = null;

function getCurrentSchemaName(oConnection) {
    return oConnection.executeQuery("SELECT CURRENT_SCHEMA FROM \"sap.plc.db::DUMMY\"")[0].CURRENT_SCHEMA;
}


function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

function clean(oConnection) {
    closeSqlConnection(oConnection)
    return true;
}

function check(oCurrentConnection){
    return true;
}

function run(oConnection) {

    const sCurrentSchema = getCurrentSchemaName(oConnection);
    const sCurrentUser = $.getPlcUsername();
    const oStatuses = oConnection.executeQuery(`SELECT STATUS_ID, DISPLAY_ORDER FROM "${sCurrentSchema}"."${sStatusTableName}" ORDER BY DISPLAY_ORDER,STATUS_ID ASC`);
    const aDisplayOrders = helpers.transposeResultArrayOfObjects(oStatuses).DISPLAY_ORDER;

    if(oStatuses.length > 0 && new Set(aDisplayOrders).size !== oStatuses.length){

        var dDate = new Date().toJSON();
        var currIndex = 0;
        var storedValue = null;
        var windowLength = 0;
        var aStatusesToUpsert = [];
        var copyWindow = 0;
            // the idea is to split the array into multiple groups of equal elements ex: 1,3,3,3,4,4,4,4,8,8 ->  1,   3,3,3,   4,4,4,4,  8,8
            // every value within a group is calculated based on the first value from the previous group and the length of the previous group 
            while(currIndex < oStatuses.length){
            if(storedValue != null && storedValue >= oStatuses[currIndex].DISPLAY_ORDER){
                windowLength = Math.max(storedValue - oStatuses[currIndex].DISPLAY_ORDER + 1, 0);
            } else{
                windowLength = 0;
            }

            aStatusesToUpsert.push([oStatuses[currIndex].STATUS_ID, oStatuses[currIndex].DISPLAY_ORDER + windowLength, dDate, sCurrentUser]);
            copyWindow = windowLength;

            var nextIndex = currIndex + 1;
            while(nextIndex < oStatuses.length && oStatuses[currIndex].DISPLAY_ORDER == oStatuses[nextIndex].DISPLAY_ORDER){
                ++windowLength;
                oStatuses[nextIndex].DISPLAY_ORDER = oStatuses[currIndex].DISPLAY_ORDER + windowLength;
                aStatusesToUpsert.push([oStatuses[nextIndex].STATUS_ID, oStatuses[nextIndex].DISPLAY_ORDER, dDate, sCurrentUser]);
                ++nextIndex;
            }

            oStatuses[currIndex].DISPLAY_ORDER += copyWindow;
            storedValue = oStatuses[nextIndex-1].DISPLAY_ORDER;
            currIndex = nextIndex;
        }

        oConnection.executeUpdate(`UPSERT "${sCurrentSchema}"."${sStatusTableName}" (STATUS_ID, DISPLAY_ORDER, LAST_MODIFIED_ON, LAST_MODIFIED_BY) VALUES(?,?,?,?) WITH PRIMARY KEY`, aStatusesToUpsert);
        oConnection.commit();
    }

    return true;
}