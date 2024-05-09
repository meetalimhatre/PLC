sap.ui.define(
    [
        "sap/ui/test/Opa5",
        "sap/ui/test/matchers/PropertyStrictEquals",
        "sap/ui/test/matchers/Properties",
        "sap/ui/test/actions/EnterText",
        "sap/ui/test/actions/Press",
        "../customMatcher/ItemBindingMatcher"
    ],
    function (Opa5, PropertyStrictEquals, Properties, EnterText, Press, ItemBindingMatcher) {
        "use strict";
        const delay = ms => new Promise(res => setTimeout(res, ms));

       

        function getFrameUrl(sHash, sUrlParameters) {
            var sUrl = "/base/testing/Integration/mockServer.html";
            sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

            if (sHash) {
                sHash = "#/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
            } else {
                sHash = "";
            }

            return sUrl + sUrlParameters + sHash;
        }

        return Opa5.extend("commonUi5.pages.Common", {

            selectTableItem: function(oMatchProperties){
                var checkObject = {};
                if (oMatchProperties.id) {
                    checkObject.id = new RegExp(oMatchProperties.id);
                }
                if (oMatchProperties.controlType) {
                    checkObject.controlType = oMatchProperties.controlType;
                }
                checkObject.visible = true;
                checkObject.success = function () {
                    Opa5.assert.ok(true, "Found " + oMatchProperties.propertySuccess);
                    var oTable = sap.ui.getCore().byId(checkObject.id);
                    if(oTable){
                        oTable.setSelectedItem(oTable.getItems()[oMatchProperties.index]);
                    }
                };
                checkObject.errorMessage = "Won't be able to find field with requirements: " + JSON.stringify(oMatchProperties);
                checkObject.matchers =
                    oMatchProperties.attributes ?
                    oMatchProperties.attributes.map(function (el) {
                        return new PropertyStrictEquals({
                            name: Object.keys(el)[0],
                            value: Object.values(el)[0]
                        });
                    }) : [];
                return this.waitFor(checkObject);
            },

            press: function (oActionProperties) {
                var actionObject = {};
                if (oActionProperties.id) {
                    actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);
                }
                if (oActionProperties.controlType) {
                    actionObject.controlType = oActionProperties.controlType;
                }
                actionObject.visible = true;
                actionObject.actions = [new Press()];
                if (oActionProperties.id) {
                    actionObject.success = function () {
                        Opa5.assert.ok(true, oActionProperties.id.value + " Press successful on " + oActionProperties.assertMessage);
                    };
                    actionObject.errorMessage = "Failed to click on " + oActionProperties.id.value + " on " + oActionProperties.assertMessage;
                } else {
                    actionObject.success = function () {
                        Opa5.assert.ok(true, "Press successful on " + oActionProperties.assertMessage);
                    };
                    actionObject.errorMessage = "Failed to click on " + oActionProperties.assertMessage;
                }
                actionObject.matchers =
                    oActionProperties.attributes ?
                    oActionProperties.attributes.map(function (el) {
                        return new PropertyStrictEquals({
                            name: Object.keys(el)[0],
                            value: Object.values(el)[0]
                        });
                    }) : [];
                if (oActionProperties.bndg_cntxt && oActionProperties.bndg_cntxt.length > 0) {
                    oActionProperties.bndg_cntxt.forEach(function (el) {
                        actionObject.matchers.push(new ItemBindingMatcher({
                            modelName: el.contextName,
                            propertyName: el.contextAttr,
                            propertyValue: el.targetValue
                        }));
                    });
                }
                return this.waitFor(actionObject);
            },

            enterText: function (oActionProperties) {
                var actionObject = {};
                if (oActionProperties.id) {
                    actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);
                }
                if (oActionProperties.controlType) {
                    actionObject.controlType = oActionProperties.controlType;
                }
                actionObject.visible = true;
                actionObject.actions = [new EnterText({
                    text: oActionProperties.actionText
                }).setKeepFocus(true)];
                if (oActionProperties.id) {
                    actionObject.success = function () {
                        Opa5.assert.ok(true, "Text: " + oActionProperties.actionText + ", successfully inserted in " + oActionProperties.id.value + " on " + oActionProperties.assertMessage);
                    };
                    actionObject.errorMessage = "Failed to insert " + oActionProperties.actionText + " in " + oActionProperties.id.value + " on " + oActionProperties.assertMessage;
                } else {
                    actionObject.success = function () {
                        Opa5.assert.ok(true, "Text: " + oActionProperties.actionText + ", successfully inserted on " + oActionProperties.assertMessage);
                    };
                    actionObject.errorMessage = "Failed to insert " + oActionProperties.actionText + " on " + oActionProperties.assertMessage;
                }
                actionObject.matchers =
                    oActionProperties.attributes ?
                    oActionProperties.attributes.map(function (el) {
                        return new PropertyStrictEquals({
                            name: Object.keys(el)[0],
                            value: Object.values(el)[0]
                        });
                    }) : [];
                return this.waitFor(actionObject);
            },

            iShouldSeeTheProperty: function (oMatchProperties) {
                var checkObject = {};
                if (oMatchProperties.id) {
                    checkObject.id = new RegExp(oMatchProperties.id);
                }
                if (oMatchProperties.controlType) {
                    checkObject.controlType = oMatchProperties.controlType;
                }
                if (oMatchProperties.searchOpenDialogs){
                    checkObject.searchOpenDialogs = true;
                }
                checkObject.visible = oMatchProperties.isVisible ? oMatchProperties.isVisible : true;
                checkObject.success = function (oControl) {
                    Opa5.assert.ok(true, "Found " + oMatchProperties.propertySuccess);
                };
                checkObject.enabled = oMatchProperties.isEnabled ? oMatchProperties.isEnabled : false;
                checkObject.errorMessage = "Won't be able to find field with requirements: " + JSON.stringify(oMatchProperties);
                checkObject.matchers =
                    oMatchProperties.attributes ?
                    oMatchProperties.attributes.map(function (el) {
                        return new PropertyStrictEquals({
                            name: Object.keys(el)[0],
                            value: Object.values(el)[0]
                        });
                    }) : [];
                return this.waitFor(checkObject);
            },

            iShouldSeeATreeTableWithShownShownNoOfRows : function(oMatchProperties){
                var checkObject = {};
                if (oMatchProperties.id) {
                    checkObject.id = new RegExp(oMatchProperties.id);
                }
                if (oMatchProperties.controlType) {
                    checkObject.controlType = oMatchProperties.controlType;
                }
                checkObject.visible = oMatchProperties.isVisible ? oMatchProperties.isVisible : true;
                checkObject.success = function (oControl) {
                    Opa5.assert.ok(true, "Found " + oMatchProperties.propertySuccess);
                };
                checkObject.enabled = oMatchProperties.isEnabled ? oMatchProperties.isEnabled : false;
                checkObject.errorMessage = "Won't be able to find field with requirements: " + JSON.stringify(oMatchProperties);
                
                checkObject.check = function(oControl){
                    let iNoOfRowsWithData = 0;
                    oControl[0].getRows().forEach(oRow => {
                        if (oRow.getBindingContext("view") !== null){
                            iNoOfRowsWithData++;
                        }
                    });
                    if (iNoOfRowsWithData === oMatchProperties.aggregationLength){
                        return true;
                    } else {
                        return false;
                    }
                };

                return this.waitFor(checkObject);
            },

            // Assert Message toast is displayed, takes in toast text and a description of toast
            iShouldSeeMessageToast: function (oToast) {
                return this.waitFor({
                    check: function () {
                        return sap.ui.test.Opa5.getJQuery()(".sapMMessageToast").text() == oToast.msg;
                    },
                    success: function () {
                        ok(true, "Found " + oToast.description + " Toast");
                    },
                    errorMessage: oToast.description + " Toast Not Detected or Toast Message Incorrect :/"
                });
            },
            constructor: function (oConfig) {
                Opa5.apply(this, arguments);
                this._oConfig = oConfig;
            },

            iStartMyApp: function (oOptions, sUrlParameters) {
                var oOptionsx = oOptions || {
                    delay: 0
                };
                sUrlParameters += "&serverDelay=" + oOptionsx.delay;
                this.iStartMyAppInAFrame(getFrameUrl(oOptionsx.hash, sUrlParameters));
            },

            iTeardownTheApp: function () {
                this.iTeardownMyUIComponent();
            },

            iLookAtTheScreen: function () {
                return this;
            },

            makeRandomWord: function (length) {
                var result = '';
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for (var i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            },

            makeRandomNumber: function (length) {
                var result = '';
                var characters = '0123456789';
                var charactersLength = characters.length;
                for (var i = 0; i < length; i++) {
                    result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
            },

            // Creates and formats a date used for datefilter tests, takes in a number
            // Creates date that number of days from current day
            createDate: function (numDays) {
                var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "10", "12"];
                var today = new Date();
                var newDate = new Date(today);
                newDate.setDate(newDate.getDate() + numDays);
                var targetDate = months[newDate.getMonth()] + "/" + newDate.getDate() + "/" + newDate.getFullYear();
                return targetDate;
            }
        });

    });