// This util encapsulate the node-postgres ORM mainly to convert the async api to sync api.
// So is fit for xsjs

const { Client } = require('pg');
const async = require('@sap/xsjs/node_modules/async');

var Postgres = function(credentials, autoCommit = true) {
    this.config = {
        host: credentials.hostname,
        port: parseInt(credentials.port, 10),
        user: credentials.username,
        password: credentials.password,
        database: credentials.dbname,
        ssl: {
            rejectUnauthorized: true,
            ca: credentials.sslrootcert
        }
    };
    this.credentials = credentials;
    this.autoCommit = autoCommit;
    this.client = new Client(this.config);
}

Postgres.prototype.connect = function() {
    async.waterfall.sync([
        (fCallback) => {
            if (this.client._connected || this.client._connecting) {
                return fCallback(null);
            }
            this.client.connect(fCallback);
        }
    ]);
}

Postgres.prototype.getCredentials = function () {
    return this.credentials;
}

Postgres.prototype.getConfig = function () {
    return this.config;
}

Postgres.prototype.execute = function () {
    const oResult = async.waterfall.sync([
        (fCallback) => {
            this.connect();
            this.client.query.apply(this.client, [...arguments, function(err, res) {
                if(err) {
                    console.log(err);
                    return fCallback(err);
                }
                return fCallback(null, res);
            }] );
        }
    ]);
    return oResult;
}

/**
 * This api is for executing queries 
 *
 * @param
 *            There are three ways passing the params to this api
 *            1. Text only 
 *               This way is fit for the query has no parameters, then just pass an string to this api
 *               for example: executeQuery('SELECT NOW() as now');
 *            2. Parameterized query
 *               This way is fit for if you are passing parameters to your queries, this can avoid sql injection vulnerabilities
 *               then pass a sql text which is string and an array of parameters
 *               for example:
 *                   const sSql = 'INSERT INTO users(name, email) VALUES($1, $2)';
 *                   const aValues = ['joe.qiao','wei.qiao@sap.com']
 *                   executeQuery(sSql, aValues);
 *            3. Query object
 *               Also support taking an object as an argument instead of taking a string and optional array of parameters
 *               for example:
 *                   const oQuery = {
 *                       text: 'INSERT INTO users(name, email) VALUES($1, $2)',
 *                       values: ['joe.qiao', 'wei.qiao@sap.com']
 *                   }
 *                   executeQuery(oQuery);
 * 
 * @returns {array} 
 *            array - returns an array of the queried results.
 */

Postgres.prototype.executeQuery = function() {
    return this.execute.apply(this, arguments).rows;
}

/**
 * This api is for executing update 
 *
 * @param
 *            The params of this api is same with the api executeQuery above
 * 
 * @returns {number} 
 *            number - returns the count of the affected rows.
 */

Postgres.prototype.executeUpdate = function() {
    if (this.autoCommit) {
        return this.execute.apply(this, arguments).rowCount;
    }
    try {
        this.begin();
        return this.execute.apply(this, arguments).rowCount;
    } catch (err) {
        console.log(err);
        this.rollback();
        throw err;
    }
}

Postgres.prototype.rollback = function() {
    this.execute('ROLLBACK');
}

Postgres.prototype.begin = function() {
    this.execute('BEGIN');
}

Postgres.prototype.setAutoCommit = function (bCommet) {
    this.autoCommit = bCommet;
}

Postgres.prototype.commit = function () {
    this.execute('COMMIT');
}

Postgres.prototype.close = function () {
    this.client.end();
}

function postgres(credentials, autoCommit) {
    return new Postgres(credentials, autoCommit);
}

module.exports = {
    Postgres,
    postgres
};
