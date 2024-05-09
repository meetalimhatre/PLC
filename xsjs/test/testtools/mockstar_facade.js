/*jslint undef:true*/

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

//
// Constants
//
const PlcSchema = require("../../lib/xs/db/connection/connection").getContainerSchema($);
const sContainerSrcRootPath = "src/dynamic/";
const PROCEDURE_PACKAGE_NAME_SEPARATOR = "::";
const PROCEDURE_TEMPLATE_SUFFIX = ".hdbprocedure.template";

var MockstarFacade = function (definition, arg) {
    //
    // Imports
    //
    var TableUtils = require('@sap/xsjs-test/lib/util/tableUtils');
    var tableDataSet = require('@sap/xsjs-test/lib/util/tableDataSet');
    var templateEngine; // lazy creation
    var dbArtefactController; // lazy creation

    //
    // local variables
    //
    var that = this;

    var substituteTables = {}; // map of table name aliases to {name, data}
    var substituteProcs = []; // map of procedure name aliases to procedure names
    var dataDefinitions = []; // all tables with data definitions

    // Enable to override imports for testing
    if (arg !== null && typeof (arg) === 'object') {
        if (arg.hasOwnProperty('TableUtils')) {
            TableUtils = arg.TableUtils;
        }
        if (arg.hasOwnProperty('tableDataSet')) {
            tableDataSet = arg.tableDataSet;
        }
        if (arg.hasOwnProperty('templateEngine')) {
            templateEngine = arg.templateEngine;
        }
        if (arg.hasOwnProperty('dbArtefactController')) {
            dbArtefactController = arg.dbArtefactController;
        }
        if (arg.hasOwnProperty('disableMockstar')) {
            this.disableMockstar = arg.disableMockstar;
        } else {
            this.disableMockstar = false;
        }
    }

    //
    // global settings
    //
    this.disableMockstar = this.disableMockstar || true; // no matter true or false, for PLC XSA, mockstar is essencially disabled
    this.schema = PlcSchema;
    this.userSchema = PlcSchema;
    this.currentUser = $.session.getUsername();
    this.testmodel = null; // the artefact under test (view or procedure), stays null if no procedure/view is tested
    this.copiedTestModel = null; // the copied test artefact with substitutions
    this.csvProperties = {
        separator: ',',
        headers: true,
        decSeparator: '.'
    };
    this.csvPackage = null;
    this.substituteTemplateProcs = null;

    // functions
    this.define = function (definition) {
        var i, tables, table, views, view;
        if (definition !== null && typeof definition === 'object') {
            if (definition.hasOwnProperty('testmodel')) {
                this.testmodel = definition.testmodel;
            }
            if (definition.hasOwnProperty('csvProperties') && typeof definition.csvProperties === 'object') {
                this.csvProperties = definition.csvProperties;
            }
            if (definition.hasOwnProperty('substituteTables') && typeof definition.substituteTables === 'object') {
                substituteTables = {};
                tables = definition.substituteTables;
                for (table in tables) {
                    if (typeof tables[table] === 'string') {
                        // definition just contains the table name, no data definitions
                        substituteTables[table] = {
                            name: tables[table],
                            schema: this.schema,
                            isTable: true
                        };
                    } else if (typeof tables[table] === 'object' && tables[table].hasOwnProperty('name')) {
                        // definition contains table name and data definitions
                        substituteTables[table] = {
                            name: tables[table].name,
                            data: tables[table].data,
                            schema: tables[table].schema || this.schema,
                            isTable: true
                        };
                        dataDefinitions.push([table, substituteTables[table]]);
                    }
                }
            }
            if (definition.hasOwnProperty('substituteViews') && typeof definition.substituteViews === 'object') {
                views = definition.substituteViews;
                for (view in views) {
                    if (typeof views[view] === 'string') {
                        // definition just contains the table name, no data definitions
                        substituteTables[view] = {
                            name: views[view],
                            schema: this.schema,
                            isView: true
                        };
                    } else if (typeof views[view] === 'object' && views[view].hasOwnProperty('name')) {
                        // definition contains table name and data definitions
                        substituteTables[view] = {
                            name: views[view].name,
                            testTable: views[view].testTable,
                            data: views[view].data,
                            schema: views[view].schema || this.schema,
                            isView: true
                        };
                        dataDefinitions.push([view, substituteTables[view]]);
                    }
                }
            }
            if (definition.hasOwnProperty('substituteProcs') && Array.isArray(definition.substituteProcs)) {
                for (i = 0; i < definition.substituteProcs.length; i++) {
                    substituteProcs.push(definition.substituteProcs[i]);
                }
            }
            if (definition.hasOwnProperty('csvPackage')) {
                this.csvPackage = definition.csvPackage;
            }
            createTestTablesAndViews();
            if (definition.hasOwnProperty('substituteTemplateProcs')) {
                this.substituteTemplateProcs = definition.substituteTemplateProcs
            }

            if (this.testmodel != null) {
                createTestModel();
            }
        }
    };

    this.getSubstituteTables = function () {
        return substituteTables;
    };

    this.getSubstituteProcs = function () {
        return substituteProcs;
    };

    // call a procedure with a set of arguments and return array of tableDataSets
    function callTestmodel(parameter, testmodelName) {
        var numberOutParameter = 0;
        var result = [];
        var i;
        var runTimePath = null;
        if (typeof that.testmodel === 'string' ||
            (typeof that.testmodel === 'object' && that.testmodel.isTemplateProc === true)) {
            runTimePath = that.copiedTestModel.runTimePath
        } else {
            runTimePath = that.copiedTestModel[testmodelName].runTimePath;
        }

        var procName = runTimePath.replace(/\"(.+)\"\.\"(.+)\"/, '$2');
        var procSchema = runTimePath.replace(/\"(.+)\"\.\"(.+)\"/, '$1');
        var callParameter = [];

        if (parameter !== null && parameter.length > 0) {
            for (i = 0; i < parameter.length; i++) {
                if (parameter[i] === null) {
                    numberOutParameter++;
                } else if (typeof parameter[i] === 'number') {
                    callParameter.push(parameter[i]);
                } else if (typeof parameter[i] === 'object' && parameter[i].hasOwnProperty('isParameter') && parameter[i].hasOwnProperty('copyName')) {
                    callParameter.push(parameter[i].copyName); // TODO: unclear if this works
                } else {
                    callParameter.push(parameter[i]);
                }
            }
        }

        var procedure = jasmine.dbConnection.loadProcedure(procSchema, procName);
        var procResult = procedure.apply(null, callParameter);

        var actualOutParameter = 0;
        for (var param in procResult) actualOutParameter++;

        if (actualOutParameter !== numberOutParameter) {
            throw new Error("Number of procedure parameters different than expected");
        }
        for (var param in procResult) {
            if (_.isArray(procResult[param]) && _.isArray(procResult[param].metadata) && _.isArray(procResult[param].metadata.columns)) {
                result.push(createTableDataSetFromResultSet(tableDataSet, procResult[param]));
            } else {
                result.push(procResult[param]);
            }
        }
        return numberOutParameter === 1 ? result[0] : result;
    };

    this.execQuery = function (query) {
        query = processStatement(query);

        // Only for jasmine.dbConnection ($.hdb.getConnection())
        var resultSet = jasmine.dbConnection.executeQuery(query);
        return createTableDataSetFromResultSet(tableDataSet, resultSet);
    };

    this.execSingle = function (statement) {
        statement = processStatement(statement);
        jasmine.dbConnection.executeUpdate(statement);
    };

    this.loadProcedure = function (procName) {
        if (procName === undefined) {
            var testModelProcedureName = this.testmodel;
            procName = testModelProcedureName.replace("/", "::");
        }
        var fullProcName = procName;
        var procedure = jasmine.dbConnection.loadProcedure(fullProcName);
        return procedure;
    };

    // add a single or multiple rows to a table
    // data if one of the following:
    // - one array with all values of a single row in the order of the table definition
    // - one array of arrays: the first element contains all used column names and each additional
    //   element contains one row of data in the order defined by the header row
    // - one object with column names as keys and an array of values for rows in this column
    // - one object with column names as keys and a single value as data for this column
    this.insertTableData = function (tableName, data) {
        var fullTableName = substituteTables[tableName].copyName;
        try {
            processData('INSERT INTO', fullTableName, data);
        } catch (e) {
            console.log(`${fullTableName}:  ${e.message}`)
        }
    };

    this.upsertTableData = function (tableName, data, whereCondition) {
        var fullTableName = substituteTables[tableName].copyName;
        processData('UPSERT', fullTableName, data, whereCondition);
    };

    this.initializeData = function () {
        for (var i = 0; i < dataDefinitions.length; i++) {
            this.insertTableData(dataDefinitions[i][0], dataDefinitions[i][1].data);
        }
    };

    this.cleanup = function (path) {
        dropTemplateProcedures();
    };

    this.cleanupMultiple = function (list) {};

    this.clearTables = function () {
        var tables, i;
        if (arguments !== null && arguments.length > 0) {
            if (arguments.length === 1 && Array.isArray(arguments[0])) {
                tables = arguments[0];
            } else {
                tables = arguments;
            }

            var sqlTables = [];
            for (i = 0; i < tables.length; i++) {
                if (typeof tables[i] === 'string') {
                    var tableObj = substituteTables[tables[i]];
                    if (tableObj.hasOwnProperty('isTable')) {
                        sqlTables.push('"' + tableObj.name + '"');
                    }
                }
            }
            batchClearTables(sqlTables);
        }
    };

    this.clearTable = function (tableName) {
        let tableObj = substituteTables[tableName];
        if (tableObj.hasOwnProperty('isTable')) {
            if (!that.disableMockstar) {
                let tableUtils = getTableUtils();
                tableUtils.clearTableInUserSchema(tableObj.name);
            } else {
                jasmine.dbConnection.executeUpdate('delete from "' + tableObj.schema + '"."' + tableObj.name + '"');
            }
        } else {
            let tableUtils = getTableUtils();
            tableUtils.clearTableInUserSchema(tableObj.testTable);
        }
    };

    this.clearAllTables = function () {
        var table, sqlTables = [];
        for (table in substituteTables) {
            var tableObj = substituteTables[table];
            if (tableObj.hasOwnProperty('isTable')) {
                sqlTables.push('"' + tableObj.name + '"');
            }
        }
        batchClearTables(sqlTables);
    };

    this.fillFromCsvFile = function (tableName, csvName) {
        var fullTableName = substituteTables[tableName].copyName;
        that.fillFromCsvFileFullTableName(fullTableName, csvName);
    };

    this.fillFromCsvFileFullTableName = function (fullTableName, csvName) {
        let tableUtils = getTableUtils();
        var colonIndex = csvName.indexOf("::");
        if (colonIndex === -1) {
            // use csvPackage setting
            tableUtils.fillFromCsvFile(fullTableName, this.csvPackage, csvName, this.csvProperties);
        } else {
            // use package contained in csvName
            var csvPkg = csvName.substr(0, colonIndex); // TODO Regex
            csvName = csvName.substr(colonIndex + 2);
            tableUtils.fillFromCsvFile(fullTableName, csvPkg, csvName, this.csvProperties);
        }
    };

    // Public Getter functions

    this.getTable = function (tableName) {
        return substituteTables[tableName].name;
    };

    this.getTableSchema = function (tableName) {
        return substituteTables[tableName].schema;
    };

    this.getFullTableName = function (tableName) {
        return substituteTables[tableName].copyName;
    };

    this.getView = function (viewName) {
        return substituteTables[viewName].name;
    };

    this.getViewSchema = function (viewName) {
        return substituteTables[viewName].schema;
    };

    //
    // Private functions
    //

    function createTestModel() {
        var table = null,
            i, proc, model = null;
        var dependencySubstitutions = [];

        for (table in substituteTables) {
            dependencySubstitutions.push(buildSubstitutionRule(substituteTables[table].schema, substituteTables[table].name, substituteTables[table].copyName));
        }
        for (i = 0; i < substituteProcs.length; i++) {
            proc = substituteProcs[i];
            dependencySubstitutions.push(buildProcSubstitutionRule(proc.schema || that.schema, proc.name, proc.testSchema || that.schema, proc.testProc));
        }

        {
            // TODO: Emulate Mockstar call, do not actually create mock procedures, views, or tables
            if (typeof that.testmodel === 'string') {
                that.copiedTestModel = {
                    runTimePath: '"' + that.schema + '"."' + that.testmodel.replace(/\//, '::') + '"'
                };
                that.call = function () {
                    return callTestmodel(arguments !== null && arguments.length > 0 ? arguments : []);
                };
            } else if (typeof that.testmodel == 'object' && that.testmodel.isTemplateProc === true) {
                let dbArtefactController = getDbArtefactController();

                // mockstar is not able to mock template-based procedures, which we use to deal with custom fields, because it
                // requires that mocked procedures are available as design-time artefacts (.hdbprocedure) in the repository;
                // the following code does the necessary setup without using mockstar for it:
                //  1. load the template of the procedures under test into a string variable
                //  2. change the name of the procedure under test to the testProc defined in the testmodel
                //  3. Use the template engine to replace templates from procedure code
                //  4. for each called template-based procedure, which shall be replaced, defined in array that.substituteTemplateProcs:
                //      3.1 load the template of the substitute procedure
                //      3.2 use the template engine to replace templates from procedure code
                //      3.3 create the substitute procedure
                //  5. create the procedure using the altered code of the loaded procedure
                //  6. initialize that.copiedTestModel and that.call so that mockstar with template procedure can be used normally

                // create the context object needed by the template engine, if wanted by the client
                let oContextObject = {};
                if (that.testmodel.createTemplateEngineContextObject) {
                    oContextObject = dbArtefactController.createContextObject();
                }

                // utility function to load a template from repository and replace the used templates with generated SQL stmts
                // for custom fields (done by the templateEngine)
                var fLoadTemplate = function (sName, oContext) {
                    let [sPackage, sProcName] = sName.split(PROCEDURE_PACKAGE_NAME_SEPARATOR);
                    sPackage = sPackage.replace(/\./g, "/");
                    if (sPackage.startsWith('sap/plc_test')) {
                        sPackage = sPackage.replace("sap/plc_test/", "test/");
                    } else {
                        sPackage = "lib/" + sPackage;
                    }
                    const templatePath = path.resolve(appRoot, sPackage, sProcName + PROCEDURE_TEMPLATE_SUFFIX);
                    const sRawContent = fs.readFileSync(templatePath, {
                        encoding: 'utf8'
                    });

                    templateEngine = templateEngine || new(require("../../lib/xs/db/generation/template-engine").TemplateEngine)();
                    return templateEngine.compile(sRawContent, oContextObject);
                }

                // change the name of the procedure under test to the name defined in that.testmodel.testProc
                const rRenamePattern = /PROCEDURE\s+"[a-zA-Z0-9_\.]+::\w+"/i;
                let sProcedureString = fLoadTemplate(that.testmodel.name);
                sProcedureString = sProcedureString.replace(rRenamePattern, `PROCEDURE "${that.testmodel.testProc}"`)

                // for each substituded sub-procedure: load, replace template and create;
                // replace the call stmt of the procedure under test afterwards
                that.substituteTemplateProcs.forEach(oSubstitude => {
                    const sSubstitudeSql = fLoadTemplate(oSubstitude.testProc);
                    try {
                        //that.execSingle(sSubstitudeSql);
                        dbArtefactController.hdiUpsertFiles([{
                            PATH: sContainerSrcRootPath + oSubstitude.testProc.replace(/\.|::/g, '/') + '.hdbprocedure',
                            CONTENT: sSubstitudeSql
                        }]);
                    } catch (e) {
                        console.log(e.message);
                    }

                    const rReplaceCalledProcedurePattern = new RegExp(`call.+"${oSubstitude.name}"`, "i");
                    sProcedureString = sProcedureString.replace(rReplaceCalledProcedurePattern, `CALL "${oSubstitude.testProc}"`);
                });

                // create test double from altered string
                //that.execSingle(sProcedureString);
                dbArtefactController.hdiUpsertFiles([{
                    PATH: sContainerSrcRootPath + that.testmodel.testProc.replace(/\.|::/g, '/') + '.hdbprocedure',
                    CONTENT: sProcedureString
                }]);


                that.copiedTestModel = {
                    runTimePath: `"${that.schema}"."${that.testmodel.testProc}"`
                };
                that.call = function () {
                    return callTestmodel(arguments !== null && arguments.length > 0 ? arguments : []);
                };
            } else {
                that.copiedTestModel = {};
                that.call = {};
                for (model in that.testmodel) {
                    that.copiedTestModel[model] = {
                        runTimePath: '"' + that.schema + '"."' + that.testmodel[model] + '"'
                    };
                    // Immediatly-ivoked function expression to create the call object with functions
                    that.call[model] = (function (j) {
                        return function () {
                            return callTestmodel(arguments !== null && arguments.length > 0 ? arguments : [], j);
                        };
                    }(model));
                }
            }
        }
    }

    function createTestTablesAndViews() {
        for (var table in substituteTables) {
            if (substituteTables[table].hasOwnProperty('isTable')) {
                substituteTables[table].copyName = '"' + substituteTables[table].schema + '"."' + substituteTables[table].name + '"';
            } else if (substituteTables[table].hasOwnProperty('isView')) {
                substituteTables[table].copyName = '"' + substituteTables[table].schema + '"."' + substituteTables[table].testTable + '"';
            }
        }
    }

    function buildSubstitutionRule(originSchema, originName, testTableName) {
        return {
            original: {
                schema: originSchema,
                name: originName
            },
            substitute: testTableName
        };
    }

    function buildProcSubstitutionRule(originSchema, originProcedureName, targetSchema, testProcedureName) {
        return {
            original: {
                schema: originSchema,
                name: originProcedureName
            },
            substitute: {
                schema: targetSchema,
                name: testProcedureName
            }
        };
    }

    function processStatement(query) {
        query = query.replace(/\{\{(.+?)\}\}/g, function (match, p1) { // replace {{tablename}} by full table name
            return substituteTables[p1].copyName;
        });
        query = query.replace(/\{\{\}\}/g, function (match) { // replace {{}} by fake procedure/view under test
            return that.copiedTestModel.runTimePath;
        });
        return query;
    }

    function processData(sqlStatement, fullTableName, data, whereCondition) {

        var sql;

        function processWhereCondition() {
            if (sqlStatement === 'UPSERT' && whereCondition !== undefined && whereCondition !== null) {
                sql += ' WHERE ' + whereCondition;
            }
        }

        function processObject(obj) {
            let numberOfRows, firstColumn, arrayRows;

            // data as object map, columns as keys
            sql = sqlStatement + ' ' + fullTableName + ' (';
            firstColumn = true;
            let parameterList = "";
            for (let column in obj) {
                if (firstColumn === true) {
                    firstColumn = false;
                    parameterList = "?";
                    if (Array.isArray(obj[column])) {
                        arrayRows = true;
                        numberOfRows = obj[column].length;
                    } else {
                        arrayRows = false;
                        numberOfRows = 1;
                    }
                    sql += '"' + column + '"';
                } else {
                    sql += ',"' + column + '"';
                    parameterList += ",?";
                }
            }
            if (numberOfRows > 0) {
                sql += ') VALUES (' + parameterList + ')';

                processWhereCondition();

                let sqlParameter = [sql];
                if (arrayRows) {
                    let allRowValues = new Array(numberOfRows);
                    let numberOfColumns = _.size(obj);
                    for (let row = 0; row < numberOfRows; row++) {
                        let rowValues = allRowValues[row] = new Array(numberOfColumns);

                        let j = 0;
                        for (let column in obj) {
                            let val = obj[column][row];
                            rowValues[j++] = (val !== undefined ? val : null);
                        }
                    }
                    sqlParameter.push(allRowValues);
                } else {
                    for (let column in obj) {
                        sqlParameter.push(obj[column] !== undefined ? obj[column] : null);
                    }
                }
                let dbConnection = jasmine.dbConnection;
                dbConnection.executeUpdate.apply(dbConnection, sqlParameter);
            }
        }

        if (data !== null) {
            if (typeof data === 'string') {
                // load csv data
                that.fillFromCsvFileFullTableName(fullTableName, data);
            } else if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    processObject(data[i]);
                }
            } else if (typeof data === 'object') {
                processObject(data);
            }
        }
    }


    /**
     * Utility function to drop the created test double for template procedures and the used substitute procedures.
     * Function checks if the testmodel contains a definition for this and drops test procedure if so. Hence, it's
     * safe to call the function without checking the testmodel.
     */
    function dropTemplateProcedures() {
        if (that.testmodel !== null && typeof that.testmodel === 'object' && that.testmodel.isTemplateProc === true) {
            let dbArtefactController = getDbArtefactController();

            //that.execSingle(`drop procedure "${that.schema}"."${that.testmodel.testProc}"`);
            dbArtefactController.hdiDeleteFiles([
                sContainerSrcRootPath + that.testmodel.testProc.replace(/\.|::/g, '/') + '.hdbprocedure'
            ]);
            // that.substituteTemplateProcs.forEach((oSubstitude) => {
            //  that.execSingle(`drop procedure "${that.schema}"."${oSubstitude.testProc}"`);
            // });
            dbArtefactController.hdiDeleteFiles(that.substituteTemplateProcs.map(proc => (sContainerSrcRootPath + proc.testProc.replace(/\.|::/g, '/') + '.hdbprocedure')));

        }
    }

    /**
     * Utility functiion to get the TableUtils instance associated with the current connection.
     */
    function getTableUtils() {
        let dbConnection = jasmine.dbConnection;
        dbConnection._tableUtils = dbConnection._tableUtils || new TableUtils(dbConnection);
        return dbConnection._tableUtils;
    }

    /**
     * Utility functiion to get the DbArtefactController instance lazily.
     */
    function getDbArtefactController() {
        dbArtefactController = dbArtefactController ||
            new(require("../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController)($, jasmine.suitedbConnection);
        return dbArtefactController;
    }

    // Construtor function additional initializations
    // Call define with parameter of MockstarFacade constructor function
    if (definition !== null && typeof (definition) === 'object') {
        this.define(definition);
    }
};

/**
 * //TODO
 * Workaround: Convert result set to TableDataSet,
 * add column metadata for resultset, even if the resultset is empty
 *
 * @param tableDataSet - tableDataSet lib
 * @param resultSet - resultSet from executeQuery or loadProcedure
 */
function createTableDataSetFromResultSet(tableDataSet, resultSet) {
    if (_.isNil(resultSet)) {
        return null;
    }
    var rsMetaData = resultSet.metadata;

    var _tableDataSet = new tableDataSet.TableDataSet();
    var isFirstRow = true;
    if (resultSet.length > 0) {
        resultSet.forEach(function (row) {
            Object.keys(row).forEach(function (columnName, index) {
                var column = null;
                if (isFirstRow) {
                    column = createColumnFromData(columnName, [], rsMetaData.columns[index]);
                    _tableDataSet.addColumn(column);
                } else {
                    column = _tableDataSet.getColumn(columnName);
                }
                if (column) {
                    // TODO: Workaround to retrieve value of BIGIN column,
                    // because resultset for BIGINT column different with other type columns.
                    // e.g. { 'COUNT(*)': [ { [String: '3'] _val: 3 } ],
                    //         CALCULATION_ID: [ 5078 ] }
                    if (rsMetaData.columns[index].type === $.hdb.types.BIGINT) {
                        column.addRow(row[columnName]._val);
                    } else {
                        column.addRow(row[columnName]);
                    }
                }
            });
            isFirstRow = false;
        });
    } else {
        // if resultSet.length = 0, still should return metadata
        // create hdb columns
        Array.forEach(rsMetaData.columns, function (column, index) {
            _tableDataSet.addColumn(new ColumnDataSet({
                ColumnLabel: column.label || column.name || ("Column #" + (index + 1)),
                ColumnType: column.type,
                ColumnTypeName: getColumnTypeName(column.type)
            }));
        });

        // import hdb data
        var columns = _tableDataSet.getColumns();
        Array.forEach(resultSet, function (row) {
            columns.forEach(function (col, index) {
                col.addRow(row[index]);
            });
        });
    }
    if (!_tableDataSet.isWellFormed()) {
        throw new Error("dataset contains undefined values");
    }

    return _tableDataSet;
}

/**
 * Copy of $.hdb.types
 * https://help.sap.com/http.svc/rc/3de842783af24336b6305a3c0223a369/2.0.01/en-US/$.hdb.html#types
 */
function getColumnTypeName(type) {
    var typeName = null;
    switch (type) {
        case 1:
            typeName = "TINYINT";
            break;
        case 2:
            typeName = "SMALLINT";
            break;
        case 3:
            typeName = "INTEGER";
            break;
        case 4:
            typeName = "BIGINT";
            break;
        case 5:
            typeName = "DECIMAL";
            break;
        case 6:
            typeName = "REAL";
            break;
        case 7:
            typeName = "DOUBLE";
            break;
        case 8:
            typeName = "CHAR";
            break;
        case 9:
            typeName = "VARCHAR";
            break;
        case 10:
            typeName = "NCHAR";
            break;
        case 11:
            typeName = "NVARCHAR";
            break;
        case 12:
            typeName = "BINARY";
            break;
        case 13:
            typeName = "VARBINARY";
            break;
        case 14:
            typeName = "DATE";
            break;
        case 15:
            typeName = "TIME";
            break;
        case 16:
            typeName = "TIMESTAMP";
            break;
        case 25:
            typeName = "CLOB";
            break;
        case 26:
            typeName = "NCLOB";
            break;
        case 27:
            typeName = "BLOB";
            break;
        case 47:
            typeName = "SMALLDECIMAL";
            break;
        case 51:
            typeName = "TEXT";
            break;
        case 52:
            typeName = "SHORTTEXT";
            break;
        case 55:
            typeName = "ALPHANUM";
            break;
        case 62:
            typeName = "SECONDDATE";
            break;
        case 74:
            typeName = "ST_GEOMETRY";
            break;
        case 75:
            typeName = "ST_POINT";
            break;
        default:
            throw new Error(`Type (${type}) is not supported.`);
    }
    return typeName;
}

// extend createColumnFromData from XSA
// add third parameter: metaData
function createColumnFromData(columnName, values, metaData) {
    var column = new ColumnDataSet({
        ColumnLabel: columnName /*.toUpperCase()*/ ,
        ColumnType: metaData.type,
        ColumnTypeName: getColumnTypeName(metaData.type)
    }, null);
    if (!Array.isArray(values)) {
        column.rows.push(values); //insert single value
    } else {
        column.rows = values;
    }
    return column;
}

/**
 * Copy of ColumnDataSet from XSA
 */
function ColumnDataSet(metaData, getterName, colIndex) {
    this.metaData = metaData;
    this.getterName = getterName;
    this.colIndex = colIndex;
    this.rows = [];
}

ColumnDataSet.prototype.getName = function () {
    return this.metaData.ColumnLabel;
};

ColumnDataSet.prototype.toString = function () {
    return this.getName();
};

ColumnDataSet.prototype.getTypeName = function () {
    return this.metaData.ColumnTypeName;
};

ColumnDataSet.prototype.getType = function () {
    return this.metaData.ColumnType;
};

ColumnDataSet.prototype.getRows = function () {
    return this.rows;
};

ColumnDataSet.prototype.getRowCount = function () {
    return this.rows.length;
};

ColumnDataSet.prototype.getRow = function (rowIndex) {
    return this.rows[rowIndex];
};

ColumnDataSet.prototype.addRow = function (row) {
    this.rows.push(row);
};

ColumnDataSet.prototype.deleteRow = function (rowIndex) {
    return this.rows.splice(rowIndex, 1)[0];
};

ColumnDataSet.prototype.clone = function () {
    var clonedSet = new ColumnDataSet(this.metaData, this.getterName, this.colIndex);
    clonedSet.rows = this.rows.slice(0);
    return clonedSet;
};



/**
 * Utility functiion to do table cleanup on batch
 *
 * @param tables - array of table names
 */
function batchClearTables(tables) {
    if (tables.length === 1) {
        jasmine.dbConnection.executeUpdate(`delete from ${tables[0]}`);
    } else if (tables.length > 1) {
        // Here "delete from ..." is used instead of "truncate table ...' because it is actaually much faster
        // although the document says the opposite
        var sql = `DO (IN TABLE_STR VARCHAR(4000) => '${tables.join(';')};')
            BEGIN
                WHILE LOCATE(:TABLE_STR, ';') > 0 DO
                    EXEC 'DELETE FROM ' || SUBSTR_BEFORE(:TABLE_STR, ';');
                    TABLE_STR := SUBSTR_AFTER(:TABLE_STR, ';');
                END WHILE;
                select ::rowcount from dummy;
            END`;
        jasmine.dbConnection.executeUpdate(sql);
    };
}

module.exports.MockstarFacade = MockstarFacade;
