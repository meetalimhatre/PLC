/*eslint no-console: 0*/
"use strict";
const runtime = require('./runtime.js');
const _ = require('lodash');
const Testrunner = require("./testrunner.js");
const xsenv = require("@sap/xsenv");
const testUtil = require("../../utils/testUtil.js");
const auditLogging = require("@sap/xsjs/node_modules/@sap/audit-logging");

/**
 * get options of hana and uaa service
 */
function getServices() {
    let options = {
    };
    // configure HANA
    try {
        if (testUtil.isCloud()) {
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

    return options;
}

//Init plc testrunner instance
module.exports = function(options) {
    xsenv.loadEnv();
    global.MTA_METADATA = JSON.parse(process.env.PLC_METADATA);

    const testResultsDir = "./.testresults";
    const testResultFileName = "report";
    const coverageFile = "coverage";
    let defaultOptions = {
        anonymous : true,
        test: {
            format: "html",
            reportdir: testResultsDir,
            filename: testResultFileName,
            pattern: '.*(tests|test)$'
        },
        context: { MTA_METADATA: global.MTA_METADATA, String: String, Date: Date, Array: Array }
    };

    // @sap/xsjs-test needs code instruments to implement the test coverage functionality. This causes the VS Code debug function messed up.
    // By default, developers do not need to get the test coverage data. Hence options.coverage is defaulted to false.
    // If a developer needs to switch it on, put "coverage=1" into the test configuration file, i.e., .test file
    var coverage = options.coverage;
    if (undefined === coverage || null === coverage) {
        // typically Jinkins CI build runs on Linux. develpers users Win/Mac
        coverage = ('linux' === process.platform);
    }
    if ('true' === coverage || true === coverage || '1' === coverage || 1 === coverage) {
        defaultOptions = _.merge({}, defaultOptions, {
            coverage: {
                reporting: {
                    reports: ["json"]
                },
                instrumentation: {
                    excludes: ['**/thirdparty/**']
                },
                dir: testResultsDir,
                filename: coverageFile
            }
        });
    }

    const serviceOptions = getServices();

    // Using Audit log REST API v2, print audit logs to console for testframework
    auditLogging.v2({ logToConsole: true }, function (err, auditLog) {
        if (err) {
            return console.log('Could not create audit log client:', err);
        }
        defaultOptions.context.auditLog = auditLog;
        global.auditLog = auditLog;
        const mergeOptions = _.merge({}, defaultOptions, { test: options }, serviceOptions);
        runtime(_.merge({}, serviceOptions, { username: options.username, password: options.password, tenantId: options.tenantId }));
        return Testrunner(mergeOptions);
    });
};
