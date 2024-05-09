sap.ui.define([
    "sap/ui/core/util/MockServer",
    "sap/base/Log",
], function (MockServer, Log) {
    "use strict";

    return {
        /**
         * Initializes the mock server.
         * You can configure the delay with the URL parameter "serverDelay".
         * The local mock data in this folder is returned instead of the real data for testing.
         * @public
         */
        init: function () {
            var plcXsRest = "sap/plc/xs/rest";
            var dispatcher = plcXsRest + "/dispatcher.xsjs";
            var calversions = {};
            var retentionPeriods = {};
            var layouts = {};
            var metadata = null;
            var i18n = null;
            var bomCompareNode_1 = {};
            var bomCompareNode_2 = {};
            var bomCompareNode_3 = {};
            var bomCompareNode_4 = {};
            var bomCompareNode_5 = {};
            var bomCompareExcelExport = {};

            fetch("./localService/mockdata/retentionPeriods.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    retentionPeriods = json;
                });

            fetch("./localService/BOM_Compare_metadata.xml")
                .then(response => {
                    return response.text();
                })
                .then(xml => {
                    metadata = xml;
                });
            fetch("./localService/mockdata/Layouts.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    layouts = json;
                });      
            fetch("./localService/mockdata/BOM_COMPARE_NodeOne.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareNode_1 = json;
                });
            fetch("./localService/mockdata/BOM_COMPARE_NodeTwo.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareNode_2 = json;
                });
            fetch("./localService/mockdata/BOM_COMPARE_NodeThree.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareNode_3 = json;
                });
            fetch("./localService/mockdata/BOM_COMPARE_NodeFour.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareNode_4 = json;
                });
            fetch("./localService/mockdata/BOM_COMPARE_NodeFive.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareNode_5 = json;
                });
            fetch("./localService/mockdata/BOM_COMPARE_ExcelExport.json")
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    bomCompareExcelExport = json;
                });

            // create
            var oDataMockServer = new MockServer({
                rootUri: "/analytics/services.xsodata/"
            });

            // simulate against the metadata and mock data
            oDataMockServer.simulate("./localService/BOM_Compare_metadata.xml", {
                sMockdataBaseUrl: "./localService/mockdata",
                bGenerateMissingMockData: true
            });

            var aODataMockServerRequests = oDataMockServer.getRequests();

            var oMockServer = new MockServer({
                rootUri: "/"
            });

            // simulate against the metadata and mock data
            oMockServer.simulate("./localService/metadata.xml", {
                sMockdataBaseUrl: "./localService/mockdata",
                bGenerateMissingMockData: true
            });

            var aMockServerRequests = oMockServer.getRequests();

            aMockServerRequests.push({
                method: "GET",
                path: "ui5/common/i18n/i18n(.*).properties",
                response: function (oXhr, sUrlParams) {
                    var urlA = oXhr.url.split("/");
                    var file = urlA[urlA.length - 1];
                    fetch("/base/tools/commonUi5/i18n/" + file)
                        .then(response => {
                            return response.text();
                        })
                        .then(properties => {
                            i18n = properties;
                            oXhr.respond(200, {
                                "Content-Type": null
                            }, i18n);
                        });                 
                }
            });

            aMockServerRequests.push({
                method: "GET",
                path: dispatcher + "/auth",
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, {});
                }
            });

            aMockServerRequests.push({
                method: "GET",
                path: dispatcher + "/global-search(.*)",
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, calversions);
                }
            });

            aMockServerRequests.push({
                method: "GET",
                path: dispatcher + "/retention-periods",
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, retentionPeriods);
                }
            });

            aMockServerRequests.push({
                method: "PUT",
                path: dispatcher + "/retention-periods",
                response: function (oXhr, sUrlParams) {
                    var obj = JSON.parse(oXhr.requestBody)[0];
                    for (let i = 0; i < retentionPeriods.body.length; i++) {
                        const element = retentionPeriods.body[i];
                        if (element.ENTITY === obj.ENTITY && element.SUBJECT === obj.SUBJECT) {
                            retentionPeriods.body[i] = obj;
                        }
                    }
                    oXhr.respondJSON(200, {}, {});
                }
            });

            aMockServerRequests.push({
                method: "POST",
                path: dispatcher + "/retention-periods",
                response: function (oXhr, sUrlParams) {
                    var obj = JSON.parse(oXhr.requestBody)[0];
                    retentionPeriods.body.push(obj);
                    oXhr.respondJSON(200, {}, {});
                }
            });

            aMockServerRequests.push({
                method: "DELETE",
                path: dispatcher + "/retention-periods",
                response: function (oXhr, sUrlParams) {
                    var requestBody = JSON.parse(oXhr.requestBody);
                    for (let j = 0; j < requestBody.length; j++) {
                        const deleteElement = requestBody[j];
                        for (let i = 0; i < retentionPeriods.body.length; i++) {
                            const element = retentionPeriods.body[i];
                            if (element.ENTITY === deleteElement.ENTITY && element.SUBJECT === deleteElement.SUBJECT) {
                                retentionPeriods.body.splice(i, 1);
                            }
                        }

                    }
                    oXhr.respondJSON(200, {}, {});
                }
            });

            aMockServerRequests.push({
                method: "GET",
                path: dispatcher + "/layouts(.*)",
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, layouts);
                }
            });

            aMockServerRequests.push({
                method: "PUT",
                path: dispatcher + "/layouts(.*)",
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, layouts);
                }
            });

            aODataMockServerRequests.push({
                method: "GET",
                path:  new RegExp("BOM_COMPARE\\(versionId1=1,versionId2=2,languageId='en-US'\\)/Execute/\\$count(.*)"),
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, 5);
                    return true;
                }
            });


            aODataMockServerRequests.push({
                method: "GET",
                path:  new RegExp("BOM_COMPARE\\(versionId1=1,versionId2=2,languageId='en-US'\\)/Execute\\?\\$filter=PARENT_ID(.*)"),
                response: function (oXhr, sUrlParams) {
                    var oUrlParams = sUrlParams.match(/'(.*?)'/g);
                    if (!oUrlParams){
                        oXhr.respondJSON(200, {}, bomCompareNode_1);
                    }
                    else {
                        var sReturn = _RetrieveBomCompareResultSet(oUrlParams[0].replaceAll("'", ""), oUrlParams[1].replaceAll("'", ""));
                        oXhr.respondJSON(200, {}, sReturn);
                    }
                    return true;
                }
            });

            aODataMockServerRequests.push({
                method: "GET",
                path:  new RegExp("BOM_COMPARE\\(versionId1=1,versionId2=2,languageId='en-US'\\)/Execute\\/\\?\\$top(.*)"),
                response: function (oXhr, sUrlParams) {
                    oXhr.respondJSON(200, {}, bomCompareExcelExport);
                    return true;
                }
            });

            oMockServer.setRequests(aMockServerRequests);
            oDataMockServer.setRequests(aODataMockServerRequests);
            // start
            oMockServer.start();
            oDataMockServer.start();

            Log.info("Running the app with mock data");

            function _RetrieveBomCompareResultSet (sParentIdOne, sParentIdTwo){
                if (sParentIdOne === "1-3952" && sParentIdTwo == "2-5176"){
                    return bomCompareNode_2;
                }
                else if (sParentIdOne === '1-4028' && sParentIdTwo == '2-5207'){
                    return bomCompareNode_3;
                }
                else if (sParentIdOne === '1-4017' && sParentIdTwo == '2-5196'){
                    return bomCompareNode_4;
                }
                else if (sParentIdOne === '1-3998' && sParentIdTwo == '2-5177'){
                    return bomCompareNode_5;
                }
            }
        }

    };

});