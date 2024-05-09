async function HQueryProcedure(connection, schema_name, procedure_name) {
    this.connection = connection;
    this.schema_name = schema_name;
    this.procedure_name = procedure_name;
    this.procedure = this.connection.loadProcedure(this.schema_name, this.procedure_name);

    this.execute = function (content) {
        var convertedResult = {};
        var result = this.procedure(content);
        for (var param in result) {
            convertedResult[param] = result[param];
        }
        return convertedResult;
    };
}

async function hQueryProcedure(connection, schema_name, procedure_name) {
    return new HQueryProcedure(connection, schema_name, procedure_name);
}

async function HQueryStatement(connection, schema_name, sql_statement) {
    this.connection = connection;
    this.schema_name = schema_name;

    this.execute = async function (values) {
        if (this.schema_name) {
            this.connection.executeUpdate('set schema "' + this.schema_name + '"');
        }

        var newargs = [sql_statement];
        if (arguments.length > 0) {
            if (Array.isArray(values)) {
                newargs = newargs.concat(values);
            } else {
                newargs = newargs.concat(Array.from(arguments));
            }
        }

        if (sql_statement.toLowerCase().indexOf('select') === 0) {
            return await convertResultSet(this.connection.executeQuery.apply(connection, newargs));
        } else {
            return this.connection.executeUpdate.apply(connection, newargs);
        }
    };
}

async function hQueryStatement(connection, schema_name, sql_statement) {
    return new HQueryStatement(connection, schema_name, sql_statement);
}

var HQuery = async function (connection) {
    this.connection = connection;
    this.getConnection = function () {
        return this.connection;
    };

    // this method exists to allow chainable calls
    this.setSchema = function (schema_name) {
        this.schema_name = schema_name;
        return this;
    };
    // this method exists for symmetry reasons
    this.getSchema = function () {
        return this.schema_name;
    };

    // standard setter and getter for schema
    /*jslint nomen: true*/
    await this.undefined('schema', function (name) {
        this.schema_name = name;
        return;
    });
    await this.undefined('schema', function () {
        return this.schema_name;
    });


    this.procedure = async function (schema_name, procedure_name) {
        if (arguments.length === 1) {
            var proc_name = schema_name;
            return await hQueryProcedure(this.connection, this.schema_name, proc_name);
        }
        return await hQueryProcedure(this.connection, schema_name, procedure_name);
    };

    this.statement = async function (sql_statement, values) {
        if (arguments.length === 1) {
            return await hQueryStatement(this.connection, this.schema_name, sql_statement);
        } else {
            return await (await hQueryStatement(this.connection, this.schema_name, sql_statement)).execute(values);
        }
    };
};

async function hQuery(connection) {
    return new HQuery(connection);
}

async function convertResultSet(resultSet) {
    return resultSet;
}

module.exports.HQuery = HQuery;
module.exports.hQuery = hQuery;
export default {HQueryProcedure,hQueryProcedure,HQueryStatement,hQueryStatement,HQuery,hQuery,convertResultSet};
