sap.ui.define([

], function () {
    "use strict";

    var Helpers = {

        sleepApp : function(iTimeToSleep, oCallbackAfterSleep){
            let oSleepPromise = new Promise((resolve) => {
                let wait = setTimeout(() => {
                  clearTimeout(wait);
                  resolve();
                }, iTimeToSleep);
            });

            oSleepPromise.then(oCallbackAfterSleep);
        },

        formatProgressIndicator : function(iTotalNumberReceived, iTotalNumber){
            if (iTotalNumberReceived && iTotalNumber){
                return Math.ceil((iTotalNumberReceived / iTotalNumber) * 100);
            }
            return 0;
        },

        calculateNumberOfPaginatedBackendRequests : function(iTotalNumberOfItems, RequestDivider){
            return Math.ceil((iTotalNumberOfItems / RequestDivider));
        }

    };

    return Helpers;
});