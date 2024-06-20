const async = require('async');
const hdbext = require('hdbext');
const moment = require('moment');
const _ = require('lodash');

/**
 * TenantQuery is used for tenant DB connection creation and sql operation in multi-tenancy for special cases
 * For normal tenant DB access using $.hdb.Connection to get DB connection
 * TenantQuery is only used when you need to access tenant DB with its credentials
 * such as postinstall, license metering, which need to traversing all tenant IDs and then connect to each tenant DB with credentials
 * 
 * @param credentials {object} tenant DB credentials, use credentials to create connection
 * @param options {object} contains configuration- treatDateAsUTC
 */
var TenantQuery = function (credentials, options) {
    this.connection = null;
    this.credentials = credentials;
    this.treatDateAsUTC = options ? options.treatDateAsUTC : null;

    this.getCredentials = function () {
        return this.credentials;
    };

    this.getSchema = function () {
        return this.credentials.schema;
    };

    this.getHDICredentials = function () {
        var oHDICredentials = {
            host: this.credentials.host,
            port: this.credentials.port,
            ca: this.credentials.certificate,
            user: this.credentials.hdi_user,
            password: this.credentials.hdi_password
        };
        return oHDICredentials;
    };
};

TenantQuery.prototype.getConnection = async function () {
    if (this.connection === null) {
        this.connection = await hdbext.createConnection.sync(this.credentials);
    }
    return this.connection;
};

TenantQuery.prototype.validateAndGetParameters = async function (sqlStatement, ...options) {
    var parameterCount = sqlStatement.split('?').length - 1;
    if (options.length <= 0) {
        return null;
    } else if (options.length === 1) {
        var value = options[0];
        if (!Array.isArray(value)) {
            if (parameterCount === 1) {
                return await normalizeInput(options, this.treatDateAsUTC);
                ;
            } else {
                return null;
            }
        } else {
            var aIsValid = [];
            for (var i = 0; i < value.length; i++) {
                if (value[i].length !== parameterCount) {
                    aIsValid.push(-1);
                }
            }
            if (aIsValid.length === 0) {
                return value;
            } else {
                console.error('parameter is not consistent with sql statement');
                return null;
            }
        }
    } else {
        if (parameterCount === options.length) {
            return await normalizeInput(options, this.treatDateAsUTC);
        } else {
            console.error('parameter is not consistent with sql statement');
            return null;
        }
    }
};

TenantQuery.prototype.executeQuery = async function (sqlStatement, ...options) {
    var connection = await this.getConnection();

    var result = null;
    if (sqlStatement.split('?').length === 1) {
        result = async.waterfall.sync([function (cb) {
            connection.exec(sqlStatement, function (err, result) {
                cb(err, result);
            });
        }]);
    } else {
        var parameters = this.validateAndGetParameters(sqlStatement, ...options);
        if (parameters === null) {
            return;
        }

        result = async.waterfall.sync([
            function (cb) {
                connection.prepare(sqlStatement, function (err, statement) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, statement);
                    }
                });
            },
            function (statement, cb) {
                statement.exec(parameters, function (err, rows) {
                    cb(err, rows);
                });
            }
        ]);
    }

    return result;
};


TenantQuery.prototype.executeUpdate = async function (sqlStatement, ...options) {
    var affectRows = await this.executeQuery(sqlStatement, ...options);
    return affectRows;
};

TenantQuery.prototype.loadProcedure = async function (sSchema, sSql) {
    let oConnection = await this.getConnection();

    let _this = this;
    let oProcedure = null;

    if (sSql) {
        oProcedure = hdbext.sync.loadProcedure(oConnection, sSchema, sSql);
    } else {
        sSql = sSchema;
        oProcedure = hdbext.sync.loadProcedure(oConnection, await this.getSchema(), sSql);
    }


    return (...params) => {
        return async.waterfall.sync([async callback => {
            oProcedure(await normalizeInput(params, _this.treatDateAsUTC), callback);
        }]);
    };
};

TenantQuery.prototype.setAutoCommit = function (bCommet) {
    this.connection && this.connection.setAutoCommit(bCommet);
};

TenantQuery.prototype.commit = async function () {
    this.connection && await this.connection.commit();
};

TenantQuery.prototype.rollback = async function () {
    let oConnection = await this.getConnection();
    return async.waterfall.sync([async callback => {
        await oConnection.rollback(callback);
    }]);
};

TenantQuery.prototype.close = async function () {
    this.connection && await this.connection.close();
};

async function normalizeInput(oParams, treatDateAsUTC) {
    for (var i = 0; i < oParams.length; i++) {
        if (_.isDate(oParams[i])) {
            // hdb driver works with up to 3 digits for the fractional seconds
            oParams[i] = (treatDateAsUTC ? moment(oParams[i]).utc() : moment(oParams[i])).format('YYYY-MM-DD HH:mm:ss.SSS');
        }
    }
    return oParams;
}

function tenantQuery(credentials) {
    return new TenantQuery(credentials);
}

module.exports = {
    TenantQuery,
    tenantQuery
};
//export default { hdbext, async, moment, _, TenantQuery, normalizeInput, tenantQuery };