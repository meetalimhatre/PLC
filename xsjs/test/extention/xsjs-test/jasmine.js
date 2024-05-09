"use strict";

const _ = require('lodash');
const mJasmine = require('@sap/xsjs-test/lib/jasmine.js');
const Fiber = require('@sap/xsjs/node_modules/@sap/fibers');

const load = mJasmine.load;

mJasmine.load = function (context, runOptions) {
    const jasmineInterface = load.call(mJasmine, context, runOptions);
    const jasmine = jasmineInterface.jasmine;

    // jasmine.dbConnection:
    //   Managed database connection. According to document, the connection is rolled back and closed after each beforeOnce,
    //   after each afterOnce, and after each set of it and its corresponding beforeEach and afterEach methods.
    //   The connection is opened when used for the first time (or for the first time after it had been closed by the framework).
    Object.defineProperty(jasmine, "dbConnection", {
        configurable: true,
        enumerable: true,
        get: function getdbConnection() {
            if (_.isNil(jasmine._dbConnection) || _.isNil(jasmine._dbConnection.getClient())) {
                jasmine._dbConnection = jasmineConnectionPool.getConnection();
            }
            return jasmine._dbConnection;
        }
    });

    // jasmine.suitedbConnection is used by hdi-artefact-controller to setup and cleanup test models.
    // NOTE: this is PLC specific, not from standard and document.
    Object.defineProperty(jasmine, "suitedbConnection", {
        get: function getdbConnection() {
            if (_.isNil(jasmine._suitedbConnection) || _.isNil(jasmine._suitedbConnection.getClient())) {
                jasmine._suitedbConnection = jasmineConnectionPool.getConnection();
            }
            return jasmine._suitedbConnection;
        }
    });

    jasmine.log = function () {
        console.log.apply(this, arguments);
    }

    //manage dbConnection lifecycle
    const Spec = jasmineInterface.jasmine.Spec;
    const Suite = jasmineInterface.jasmine.Suite;
    const specExecute = Spec.prototype.execute;

    Spec.prototype.execute = function (onComplete, enabled) {
        const onCompleteHandler = function () {
            if (jasmine._dbConnection) {
                jasmineConnectionPool.releaseConnection(jasmine._dbConnection);
                jasmine._dbConnection = null;
            }

            if (_.isFunction(onComplete)) {
                onComplete();
            };
        };

        specExecute.apply(this, [onCompleteHandler, enabled]);
    };

    // Overwritting Suite.prototype.addTags.
    // When the test suite doesn't contain PLC test 'tags' parameter, disable it.
    Suite.prototype.addTags = function (tags) {
        this.tags = Array.isArray(tags) ? tags : Array.slice(arguments);

        if (!_.isEmpty(jasmineInterface.jasmine.plcTestOptions.tags) &&
            !this.tags.includes(jasmineInterface.jasmine.plcTestOptions.tags)) {
            if (this.parentSuite) {
                const children = this.parentSuite.children;
                children.splice(children.indexOf(this), 1);
                this.parentSuite = null;
            }
        }

        return this;
    };

    return jasmineInterface;
};

const jasmineConnectionPool = {
    connections: [],

    getConnection: function () {
        let self = this;
        for (let i = 0; i < self.connections.length; i++) {
            let item = self.connections[i];
            if (item && item.available && item.conn) {
                item.available = false;
                return item.conn;
            }
        }

        let newItem = {
            conn: self.createdbConnection(),
            available: false
        };
        self.connections.push(newItem);
        return newItem.conn;
    },

    releaseConnection: function (conn) {
        if (_.isNil(conn)) return;
        let self = this;
        for (let i = 0; i < self.connections.length; i++) {
            let poolItem = self.connections[i];
            if (poolItem.conn === conn) {
                poolItem.conn.rollback();
                if (poolItem.conn._tableUtils) { // added in mockstar_facade
                    delete poolItem.conn._tableUtils;
                }
                poolItem.available = true;

                if (_.isEmpty(poolItem.conn.getClient())) {
                    self.safeCloseConnection(poolItem.conn);
                    poolItem.conn = self.createdbConnection($);
                }
                break;
            }
        }
    },

    reset: function () {
        let self = this;
        _.each(self.connections, (item) => {
            self.safeCloseConnection(item.conn);
            item.conn = null;
            item.available = false;
        });
        self.connections = [];
    },

    createdbConnection: function () {
        let dbConnection = $.hdb.getConnection({ "treatDateAsUTC": true, "enableColumnIndices": false });
        dbConnection.realClose = dbConnection.close;
        dbConnection.close = function () { };
        dbConnection.executeUpdate("SET SESSION 'APPLICATIONUSER' = '" + $.session.getUsername() + "'");
        dbConnection.setAutoCommit(false);
        //walk around for data is committed though autocommit is set as false
        dbConnection.executeUpdate("SET TRANSACTION AUTOCOMMIT DDL off");
        return dbConnection;
    },

    safeCloseConnection: function (dbConnection) {
        function doClose() {
            try {
                dbConnection.rollback();
                if (_.isFunction(dbConnection.realClose)) {
                    dbConnection.realClose();
                } else {
                    dbConnection.close();
                }
            }
            catch (e) {
                //console.log(e);
            }
        };
        if (dbConnection && dbConnection.getClient()) {
            if (Fiber.current) {
                doClose();
            } else {
                Fiber(function () {
                    doClose();
                }).run();
            }
        }
    }
};

module.exports = {
    jasmineConnectionPool
};
