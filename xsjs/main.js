/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

const xsjs  = require("@sap/xsjs");
const xsenv = require("@sap/xsenv");
const port  = process.env.PORT || 3000;
const isCloud = require("./lib/platform/platformSpecificImports.js").isCloud;
const auditLogging = require("@sap/audit-logging");
// set global variable appRoot, used for template file loading
const path = require('path');
const tenantAwareTrace = require("./lib/extention/xsjs/tenantAwareTrace")
global.appRoot = path.resolve(__dirname);

xsenv.loadEnv();
global.MTA_METADATA = JSON.parse(process.env.PLC_METADATA);

var options = {
	maxBodySize: '100mb',
	redirectUrl: "/index.xsjs",
	context: { String: String, Date: Date, Array: Array, MTA_METADATA: global.MTA_METADATA }
};

// configure HANA
try {
	if (isCloud()) {
		options = Object.assign(options, xsenv.getServices({ hana: { label: "service-manager" } }));
		/*
		* This is a workaround that forces the instance manager lib to be picked up when service manager is used.
		* As soon as the xsjs library supports service manager natively, these 3 lines should be removed.
		*/
		options.hana = Object.assign(options.hana, {get_managed_instance_url: "fake-url"});
		options.hana = Object.assign(options.hana, {user: "fake-user"});
		options.hana = Object.assign(options.hana, {password: "fake-password"});
	} else {
		options = Object.assign(options, xsenv.getServices({ hana: { label: "hana" } }));
	}
} catch (err) {
	console.log("[WARN]", err.message);
}

// configure UAA
try {
	options = Object.assign(options, xsenv.getServices({ uaa: {tag: "xsuaa"} }));
} catch (err) {
	console.log("[WARN]", err.message);
}

// Add SQLCC
try {
	options.hana.sqlcc = xsenv.getServices({
		"xsjs.sqlcc_config":"xsac-plc-synonym-grantor-service"
	});
} catch (err) {
	console.log("[WARN]", err.message);
}

// configure job scheduler in XSA environment
if (!isCloud()) {
	try {
		options = Object.assign(options, xsenv.getServices({ jobs: { tag: "jobscheduler" } }));
	} catch (err) {
		console.log("[WARN]", err.message);
	}
}

var credential = null;
//configure audit-log
if (isProductionMode()) {
	try {
		options = Object.assign(options, xsenv.getServices({ auditLog: { label: "auditlog" } }));
		credential = options.auditLog;
	} catch (err) {
		console.log("[WARN]", err.message);
	}
}
else {
	credential = {
		logToConsole: true
	};
}
// Using Audit log REST API v2
auditLogging.v2(credential, function (err, auditLog) {
	if (err) {
		return console.log('Could not create audit log client:', err);
	}
	options.context = Object.assign(options.context, {auditLog: auditLog});
	global.auditLog = auditLog;

	if (isCloud()) {
		tenantAwareTrace();
	}

    const expressApp = xsjs(options);
    expressApp.disable('etag');
    const server = expressApp.listen(port);
	console.log("Server listening on port %d", port);
    try {
        var plcTimeout = JSON.parse(process.env.SAP_PLC_TIMEOUT || '120000');
        if (typeof plcTimeout !== 'number' || plcTimeout < 0) {
            throw new Error('invalid SAP_PLC_TIMEOUT: ', plcTimeout);
        }
		
		var plcKeepAliveTimeout = JSON.parse(process.env.SAP_PLC_KEEPALIVETIMEOUT || Math.ceil(plcTimeout/2));
        if (typeof plcKeepAliveTimeout !== 'number' || plcKeepAliveTimeout < 0) {
            throw new Error('invalid SAP_PLC_KEEPALIVETIMEOUT: ', plcKeepAliveTimeout);
        }
        server.setTimeout(plcTimeout);
		server.keepAliveTimeout = plcKeepAliveTimeout;
    }
    catch (error) {
        console.log("error getting env variable: %s", error.message);
    }
});

/**
 * AuditLog service is only enabled for CF/XSA production mode, otherwise, print audit-log to console for local development
 * process.env.PORT is undefined for local development
**/
function isProductionMode(){
	return process.env.NODE_ENV === "production";
}

