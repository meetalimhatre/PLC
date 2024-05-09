sap.ui.define([
    "core/utils/Constants",
    "core/connector/BackendConnector"
], function (Constants, BackendConnector) {
    "use strict";

    var Logout = {
        onUserNamePress: function (oEvent) {
            var oButton = oEvent.getSource();
            this.byId("actionSheet").openBy(oButton);
        },

        onLogout: function () {
            let sProtocol = window.location.protocol;
            let sPort = window.location.port;
            let sHostname = sProtocol + "//" + window.location.hostname + ((sPort !== "") ? (":" + sPort) : "");
            let sLogoutUrl = sHostname + "/logout";
            window.location.href = sLogoutUrl;
        },

        countdown: Constants.timeout.SESSION_TIMEOUT,

        resetCountdown: Constants.timeout.SESSION_TIMEOUT,

        /**
         * Set number of minutes left till automatic logout
         */
        _setInactivityTimeout: function (timeouMillisec) {
            this.countdown = timeouMillisec;
            this.resetCountdown = this.countdown;
        },

        /**
         * Set number of minutes left till automatic logout
         */
        _resetInactivityTimeout: function () {
            this.countdown = this.resetCountdown;
        },

        /**
         * Begin counting tracking inactivity
         */
        _startInactivityTimer: function () {
            this.intervalHandle = setInterval(function () {
                this._inactivityCountdown();
            }.bind(this), Constants.timeout.TEN_SECONDS);
        },

        stopInactivityTimer: function () {
            if (this.intervalHandle !== null) {
                clearInterval(this.intervalHandle);
                this.intervalHandle = null;
            }
        },

        _inactivityCountdown: function () {
            this.countdown -= Constants.timeout.TEN_SECONDS;	
            if (this.countdown <= 0) {
                this._ping();
            }
        },

        _ping: function() {
            BackendConnector.doGet({
                    constant: "AUTH_URL",
                },
                function() {
                    this.stopInactivityTimer();
                    this._resetInactivityTimeout();
                    this._startInactivityTimer();
                }.bind(this),
                function() {
                    window.location.href = "/logout";
                }
            );
        }
    }
    return Logout;
});