"use strict";
const _ = require("lodash");
const jasmineLib = require("@sap/xsjs-test/lib/jasmine.js");

let globalJasmine;
let suite0; // the root suite
let suitesInfo = {};
let jasmineConnectionPool;

const DEFAULT_MOCK_USER = 'TEST_USER';
let currentMockUser = DEFAULT_MOCK_USER;
let realUser; // real username for testing. no value in case of mocked user

let self = module.exports = {
    /**
     * If the function return true, it means the current environment is CF multi-tenancy
     * @return {boolean} return isCloud status
     */
    isCloud: function () {
        if (process.env.VCAP_APPLICATION) {
            const vcapApplication = JSON.parse(process.env.VCAP_APPLICATION);
            return vcapApplication.cf_api && vcapApplication.cf_api.length > 0 && process.env.TENANT_HOST_PATTERN;
        }
        return false;
    },

    /**
     * Return the current username.
     * @returns {String} the current username
     */
    getCurrentUsername: function() {
        return realUser || self.getCurrentMockUser();
    },

    getJasmine: function () {
        globalJasmine = globalJasmine || jasmineLib.interface().jasmine;
        return globalJasmine;
    },

    // Functions from jasmine. Usage example in .js testing scripts:
    // const {describe, xdescribe, fdescribe, it, xit, fit, beforeEach, afterEach, beforeAll, afterAll, beforeOnce, afterOnce, expect, pending, fail, spyOn} = require("../utils/testUtil");
    describe: function(description, specDefinitions) {
        let suite = jasmineLib.getEnv().describe(description, specDefinitions);

        // get suite0 - the root suite
        if (!suite0 && suite) {
            suite0 = suite;
            while (suite0.parentSuite) {
                suite0 = suite0.parentSuite;
            }
        }

        // record the current mock user for the top level suite. The mock user may be different for different suites
        if (suite0 && suite && suite.parentSuite && suite.parentSuite.id === suite0.id) {
            suitesInfo[suite.id] = { mockUser: currentMockUser };
        }
        return suite || { addTags: function () { } };
    },
    xdescribe: function(description, specDefinitions) {
        let suite = jasmineLib.getEnv().xdescribe(description, specDefinitions);
        if (suite) {
            if (_.isArray(suite.afterAllFns)) {
                suite.afterAllFns.splice(0);
            }
            if (_.isArray(suite.beforeAllFns)) {
                suite.beforeAllFns.splice(0);
            }
        }

        // record the current mock user for the top level suite. The mock user may be different for different suites
        if (suite0 && suite && suite.parentSuite && suite.parentSuite.id === suite0.id) {
            suitesInfo[suite.id] = { mockUser: currentMockUser };
        }
        return suite || { addTags: function () { } };
    },
    fdescribe: function(description, specDefinitions) {
        return jasmineLib.getEnv().fdescribe(description, specDefinitions);
    },

    it: function(description, fn, timeout) {
        return jasmineLib.getEnv().it(description, fn, timeout);
    },
    xit: function() {
        let env = jasmineLib.getEnv();
        let args = Array.prototype.slice.call(arguments);
        return env.xit.apply(env, args);
    },
    fit: function(description, fn, timeout) {
        return jasmineLib.getEnv().fit(description, fn, timeout);
    },

    beforeEach: function (beforeEachFunction, timeout) {
        return jasmineLib.getEnv().beforeEach(beforeEachFunction, timeout);
    },
    afterEach: function (afterEachFunction, timeout) {
        return jasmineLib.getEnv().afterEach(afterEachFunction, timeout);
    },
    beforeAll: function (beforeAllFunction, timeout) {
        return jasmineLib.getEnv().beforeAll(beforeAllFunction, timeout);
    },
    afterAll: function (afterAllFunction, timeout) {
        return jasmineLib.getEnv().afterAll(afterAllFunction, timeout);
    },

    beforeOnce: function(beforeAllFunction, timeout) {
        return jasmineLib.getEnv().beforeAll(beforeAllFunction, timeout);
    },
    afterOnce: function(afterAllFunction, timeout) {
        return jasmineLib.getEnv().afterAll(afterAllFunction, timeout);
    },

    expect: function (actual) {
        return jasmineLib.getEnv().expect(actual);
    },
    pending: function () {
        let env = jasmineLib.getEnv();
        let args = Array.prototype.slice.call(arguments);
        return env.pending.apply(env, args);
    },
    fail: function () {
        let env = jasmineLib.getEnv();
        let args = Array.prototype.slice.call(arguments);
        return env.fail.apply(env, args);
    },
    spyOn: function (obj, methodName) {
        return jasmineLib.getEnv().spyOn(obj, methodName);
    }
};

// internal test framework use
_.extend(module.exports, {
    /**
     * Internal function called when all test suites are loaded
     * @param {Object} jasConnectionPool - jasmine connection pool
     */
    onSuitesLoaded: function (jasConnectionPool) {
        // save for later usage
        const hdbGetConnection = $.hdb.getConnection;
        jasmineConnectionPool = jasConnectionPool;

        if (suite0 && _.isArray(suite0.children)) {
            _.forEach(suite0.children, function (suite) {
                if (_.isArray(suite.beforeAllFns)) {
                    // insert a beforeAll at beginning for the suite to collect the connections, plus other preparations
                    suite.beforeAllFns.unshift({
                        fn: function () {
                            let suiteInfo = suitesInfo[suite.id];
                            if (_.isUndefined(suiteInfo)) {
                                suitesInfo[suite.id] = suiteInfo = {};
                            }
                            // the mock user during jasmine it() execution must be same as the one when jasmine describe() is running
                            currentMockUser = suiteInfo.mockUser;
                            suiteInfo.allConnections = [];

                            $.hdb.getConnection = function () {
                                let args = Array.prototype.slice.call(arguments);
                                let conn = hdbGetConnection.apply(this, args);
                                suiteInfo.allConnections.push(conn);
                                return conn;
                            };
                        },
                        timeout: function () { return 5000; }
                    });
                }

                if (_.isArray(suite.afterAllFns)) {
                    // append an afterAll for the suite to do cleanups
                    suite.afterAllFns.push({
                        fn: function () {
                            currentMockUser = null;
                            jasmineConnectionPool.reset();
                            $.hdb.getConnection = hdbGetConnection;

                            const suiteInfo = suitesInfo[suite.id];
                            if (suiteInfo && _.isArray(suiteInfo.allConnections)) {
                                suiteInfo.allConnections.forEach(function (conn) {
                                    try {
                                        jasmineConnectionPool.safeCloseConnection(conn); // ignore error even if already closed
                                    } catch (e) { }
                                });
                                suiteInfo.allConnections = [];
                            }
                        },
                        timeout: function () { return 5000; }
                    });
                }
            });
        }
    },

    /**
     * Set the real user name for testing
     * @param {String} realUsername
     */
    setRealUser: function(realUsername) {
        realUser = realUsername;
    },
    /**
     * Return the real user name for testing.
     * @returns {String} the real user name for testing. No value in case of mocked user
     */
    getRealUser: function() {
        return realUser;
    },

    /**
     * Internal function to set current mock user name for the current suite
     * @param {String} mockUser current mock user name
     */
    setCurrentMockUser: function(mockUser) {
        currentMockUser = mockUser;
    },

    /**
     * Internal function to get current mock user name for the current suite
     */
    getCurrentMockUser: function() {
        return currentMockUser || DEFAULT_MOCK_USER;
    }
});
