// This is a replacement of the standard PLC dispatcher (/xs/rest/dispatcher.xsjs) to output
// additional performance information in the HTTP response.
// In order to use the tool, you must use “/sap/plc_test/testtools/performance-dispatcher.xsjs” instead
// of “/xs/rest/dispatcher.xsjs” in the request URL.
// In the PLC frontend change HanaBasePath in Sap.Plc.Utilities.Constants in the Utilities project.

var oConnectionFactory = new ($.require("../../lib/xs/db/connection/connection")).ConnectionFactory($);

// store executed SQL statements, entries are again arrays with 2 entries [executionTime, sqlString]
var aSqlStatements = [];
var aQueryStatements = [];
var aUpdateStatements = [];
var aLoadProcedureStatements = [];

// counter for different SQL statements
var iExecuteQueryCounter = 0;
var iExecuteUpdateCounter = 0;
var iloadProcedureCounter = 0;
var iCommitCounter = 0;
var iSetSchemaCounter = 0;

var realGetConnection = oConnectionFactory.getConnection;

// override getConnection function
oConnectionFactory.getConnection = function() {
	// create a real DB connection
	var connection = realGetConnection();
	
	connection.realExecuteQuery = connection.executeQuery; 
	connection.executeQuery = function() {
        var iStartTime = new Date().getTime();
		var result = connection.realExecuteQuery.apply(connection, arguments);
        var iEndTime = new Date().getTime();

	    var aSql = [(iEndTime - iStartTime), "executeQuery(" + Array.slice(arguments).join(", ") + ")"];
	    aSqlStatements.push(aSql);
	    aQueryStatements.push(aSql);
		iExecuteQueryCounter++;
		
		return result;
	};
	
	connection.realExecuteUpdate = connection.executeUpdate;
	connection.executeUpdate = function(sSqlStatement) {
        var iStartTime = new Date().getTime();
		var result =  connection.realExecuteUpdate.apply(connection, arguments);
        var iEndTime = new Date().getTime();

	    var aSql =  [(iEndTime - iStartTime), "executeUpdate(" + Array.slice(arguments).join(", ") + ")" ];
	    if (sSqlStatement.startsWith("set schema")) {
	        iSetSchemaCounter++;   
	    } else {
		    iExecuteUpdateCounter++;
    	    aUpdateStatements.push(aSql);
	    }
	    aSqlStatements.push(aSql);

		return result;
	};
	
	connection.realLoadProcedure = connection.loadProcedure; 
	connection.loadProcedure = function() {
	    var sqlString = "loadProcedure(" + Array.slice(arguments).join(", ") + ")";
		iloadProcedureCounter++;
		var result = connection.realLoadProcedure.apply(connection, arguments);

		return function() {
            var iStartTime = new Date().getTime();
		    var procResult = result.apply(null, arguments);
            var iEndTime = new Date().getTime();

    	    aSqlStatements.push([iEndTime - iStartTime, sqlString]);
	        aLoadProcedureStatements.push([iEndTime - iStartTime, sqlString]);

		    return procResult;
		};
	};
	
	return connection;
};

var iRequestStartTime = new Date().getTime();

// inject performance output in http response object by replacing setBody function
$.response.origSetBody = $.response.setBody;
$.response.setBody = function(body) {
    var executionTime = new Date().getTime() - iRequestStartTime;
    var dbExecutionTime = aSqlStatements.reduce(function(previousValue, currentValue) {
        return currentValue[0] + previousValue;
    }, 0);
    var aSorted = aSqlStatements.slice().sort(function(a, b) {
        return b[0] - a[0];
    });

    var oPayload = JSON.parse(body); // this is not really efficient as JSON.stringify was just called before, but this a general solution

    oPayload.performance = {
        "ExecuteQuery": iExecuteQueryCounter,	// number of SQL queries
        "ExecuteUpdate": iExecuteUpdateCounter, // number of SQL updates (excluding “set schema”)
        "LoadProcedure": iloadProcedureCounter,	// number of SQLScript calls
        "SetSchema": iSetSchemaCounter,			// number of “set schema” calls
        "RequestExecutionTime":  executionTime, // overall execution time in ms of the request (DB + JavaScript)
        "DbExecutionTime": dbExecutionTime,     // only DB execution time in ms
        "SQLStatements": aSqlStatements,        // SQL statements in calling order
        "ExecutionTimes": aSorted,              // SQL statements sorted by execution time
        "QueryStatements": aQueryStatements,	// SQL query statements only
        "UpdateStatements": aUpdateStatements,	// SQL update statements only
        "LoadProcedureStatements": aLoadProcedureStatements // SQLScript calls only
    };
    
    $.response.origSetBody(JSON.stringify(oPayload));
};

// Now load the real dispatcher
const DispatcherLib = $.require("../../lib/xs/impl/dispatcher");
const Dispatcher = DispatcherLib.Dispatcher;
const ctx = DispatcherLib.prepareDispatch($);
new Dispatcher(ctx, $.request, $.response).dispatch(true);
